using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public PaymentsController(AppDbContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> CreateCheckout([FromBody] CheckoutRequestDto request)
        {
            var pricingKeys = await _context.SystemConfigs
                .Where(c => c.ConfigKey.StartsWith("price_") || c.ConfigKey == "pricing_vat_inclusive")
                .ToDictionaryAsync(c => c.ConfigKey, c => c.ConfigValue);

            decimal basePrice = 0;
            string planName = "";
            
            if (request.PlanTier.Equals("starter", StringComparison.OrdinalIgnoreCase)) {
                basePrice = decimal.Parse(pricingKeys.GetValueOrDefault("price_starter_monthly", "4950"));
                planName = "NexaPlan Starter (Monthly)";
            } else if (request.PlanTier.Equals("professional", StringComparison.OrdinalIgnoreCase)) {
                basePrice = decimal.Parse(pricingKeys.GetValueOrDefault("price_professional_monthly", "12900"));
                planName = "NexaPlan Professional (Monthly)";
            } else if (request.PlanTier.Equals("enterprise", StringComparison.OrdinalIgnoreCase)) {
                basePrice = decimal.Parse(pricingKeys.GetValueOrDefault("price_enterprise_monthly", "29900"));
                planName = "NexaPlan Enterprise (Monthly)";
            } else {
                return BadRequest(new { message = "Invalid plan tier." });
            }

            bool vatInclusive = bool.Parse(pricingKeys.GetValueOrDefault("pricing_vat_inclusive", "true"));
            decimal grandTotal = 0;
            decimal taxAmount = 0;

            if (vatInclusive)
            {
                grandTotal = basePrice;
                taxAmount = grandTotal - (grandTotal / 1.12m);
            }
            else
            {
                taxAmount = basePrice * 0.12m;
                grandTotal = basePrice + taxAmount;
            }

            long finalChargeCents = (long)Math.Round(grandTotal * 100);

            var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            
            // Check database config first
            var dbConfigSecret = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == "PayMongoSecret");
            var secretKey = dbConfigSecret?.ConfigValue;
            
            if (string.IsNullOrWhiteSpace(secretKey))
            {
                secretKey = _configuration["PayMongo:SecretKey"];
            }

            if (string.IsNullOrWhiteSpace(secretKey))
            {
                return BadRequest(new { message = "PayMongo Secret Key is not configured in DB or appsettings." });
            }

            if (await _context.Users.AnyAsync(u => u.Name == request.Email))
            {
                return BadRequest(new { message = "User already exists." });
            }

            var tenant = new Tenant
            {
                CompanyName = request.CompanyName,
                SubscriptionTier = request.PlanTier,
                RegistrationStatus = "PendingPayment",
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                Phone = request.Phone,
                OrgType = string.IsNullOrWhiteSpace(request.OrgType) ? "Corporate" : request.OrgType,
                ContactPerson = $"{request.FirstName} {request.LastName}".Trim(),
                ContactEmail = request.Email
            };

            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                Name = request.Email,
                PasswordHash = passwordHash,
                TenantID = tenant.TenantID,
                RoleID = 2,
                IsActive = false
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var paymentSession = new PaymentSession
            {
                TenantID = tenant.TenantID,
                UserID = user.UserID,
                PlanTier = request.PlanTier,
                Amount = finalChargeCents,
                Currency = "PHP",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.PaymentSessions.Add(paymentSession);
            await _context.SaveChangesAsync();

            var invoice = new Invoice
            {
                TenantID = tenant.TenantID,
                Amount = grandTotal,
                TaxAmount = taxAmount,
                VatInclusive = vatInclusive,
                BillingDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(14),
                Status = false
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();



            try
            {
                var client = _httpClientFactory.CreateClient();
                client.BaseAddress = new Uri("https://api.paymongo.com/v1/");

                var authValue = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{secretKey}:"));
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authValue);

                var payload = new
                {
                    data = new
                    {
                        attributes = new
                        {
                            cancel_url = $"{frontendBaseUrl}/?payment=cancelled",
                            success_url = $"{frontendBaseUrl}/?payment=success",
                            payment_method_types = new[] { "card", "gcash", "paymaya" },
                            line_items = new[]
                            {
                                new
                                {
                                    amount = finalChargeCents,
                                    currency = "PHP",
                                    name = planName,
                                    quantity = 1
                                }
                            },
                            description = $"{planName} subscription",
                            metadata = new
                            {
                                tenantId = tenant.TenantID,
                                paymentSessionId = paymentSession.PaymentSessionID,
                                email = request.Email
                            }
                        }
                    }
                };

                var json = JsonSerializer.Serialize(payload);
                var response = await client.PostAsync("checkout_sessions", new StringContent(json, Encoding.UTF8, "application/json"));
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _context.Invoices.Remove(invoice);
                    _context.Users.Remove(user);
                    _context.Tenants.Remove(tenant);
                    _context.PaymentSessions.Remove(paymentSession);
                    await _context.SaveChangesAsync();

                    return StatusCode((int)response.StatusCode, new { message = "PayMongo checkout creation failed.", details = responseBody });
                }

                using var doc = JsonDocument.Parse(responseBody);
                var data = doc.RootElement.GetProperty("data");
                var checkoutId = data.GetProperty("id").GetString();
                var checkoutUrl = data.GetProperty("attributes").GetProperty("checkout_url").GetString();

                paymentSession.PayMongoCheckoutID = checkoutId;
                paymentSession.PayMongoCheckoutUrl = checkoutUrl;
                await _context.SaveChangesAsync();

                return Ok(new { checkoutUrl });
            }
            catch (Exception ex)
            {
                _context.Invoices.Remove(invoice);
                _context.Users.Remove(user);
                _context.Tenants.Remove(tenant);
                _context.PaymentSessions.Remove(paymentSession);
                await _context.SaveChangesAsync();
                return StatusCode(500, new { message = "Failed to start checkout session.", error = ex.Message });
            }
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> HandleWebhook([FromBody] JsonElement payload)
        {
            if (!payload.TryGetProperty("data", out var dataElement))
            {
                return BadRequest();
            }

            var attributes = dataElement.GetProperty("attributes");
            var eventType = attributes.GetProperty("type").GetString();

            if (!string.Equals(eventType, "checkout_session.payment.paid", StringComparison.OrdinalIgnoreCase))
            {
                return Ok();
            }

            var eventData = attributes.GetProperty("data");
            var checkoutId = eventData.GetProperty("id").GetString();

            if (string.IsNullOrWhiteSpace(checkoutId))
            {
                return BadRequest();
            }

            var session = await _context.PaymentSessions.FirstOrDefaultAsync(p => p.PayMongoCheckoutID == checkoutId);
            if (session == null)
            {
                return NotFound();
            }

            session.Status = "Paid";
            session.PaidAt = DateTime.UtcNow;

            var tenant = await _context.Tenants.FindAsync(session.TenantID);
            var user = await _context.Users.FindAsync(session.UserID);
            var invoice = await _context.Invoices
                .Where(i => i.TenantID == session.TenantID && !i.Status)
                .OrderByDescending(i => i.InvoiceID)
                .FirstOrDefaultAsync();

            if (tenant != null)
            {
                tenant.IsActive = true;
                tenant.RegistrationStatus = "Active";
            }

            if (user != null)
            {
                user.IsActive = true;
            }

            if (invoice != null)
            {
                invoice.Status = true;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
