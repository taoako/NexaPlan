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
            // 1. Resolve Pricing and Plan details
            var vatConfig = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == "pricing_vat_inclusive");
            bool vatInclusive = bool.Parse(vatConfig?.ConfigValue ?? "true");

            var plan = await _context.PricingPlans
                .FirstOrDefaultAsync(p => p.Name.ToLower() == request.PlanTier.ToLower());

            decimal basePrice = 0;
            string planName = "";

            if (plan != null)
            {
                basePrice = plan.MonthlyPrice;
                planName = $"NexaPlan {plan.Name} (Monthly)";
            }
            else
            {
                // Fallback for legacy requests or if table is being seeded
                if (request.PlanTier.Equals("starter", StringComparison.OrdinalIgnoreCase))
                {
                    basePrice = 4950;
                    planName = "NexaPlan Starter (Monthly)";
                }
                else if (request.PlanTier.Equals("professional", StringComparison.OrdinalIgnoreCase))
                {
                    basePrice = 12900;
                    planName = "NexaPlan Professional (Monthly)";
                }
                else if (request.PlanTier.Equals("enterprise", StringComparison.OrdinalIgnoreCase))
                {
                    basePrice = 29900;
                    planName = "NexaPlan Enterprise (Monthly)";
                }
                else
                {
                    return BadRequest(new { message = $"Plan tier '{request.PlanTier}' not found." });
                }
            }

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

            // 2. Validate Infrastructure Config
            var frontendBaseUrl = _configuration["Frontend:BaseUrl"];
            if (string.IsNullOrWhiteSpace(frontendBaseUrl))
                return BadRequest(new { message = "Frontend BaseUrl is not configured in appsettings." });

            var secretKey = _configuration["PayMongo:SecretKey"];

            if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Contains("your-paymongo-secret"))
            {
                return BadRequest(new { message = "PayMongo Secret Key is missing or invalid in the server configuration." });
            }

            // 3. User & Tenant Pre-validation / Cleanup
            var existingUser = await _context.Users
                .Include(u => u.Tenant)
                .FirstOrDefaultAsync(u => u.Name == request.Email || u.Email == request.Email);

            if (existingUser != null)
            {
                // If the user exists but is not active (pending payment/approval),
                // we delete the old records to allow a fresh checkout attempt.
                if (!existingUser.IsActive && existingUser.Tenant?.RegistrationStatus == "PendingPayment")
                {
                    var oldTenant = existingUser.Tenant;
                    var oldInvoices = await _context.Invoices.Where(i => i.TenantID == oldTenant.TenantID).ToListAsync();
                    var oldSessions = await _context.PaymentSessions.Where(p => p.TenantID == oldTenant.TenantID).ToListAsync();

                    _context.Invoices.RemoveRange(oldInvoices);
                    _context.PaymentSessions.RemoveRange(oldSessions);
                    _context.Users.Remove(existingUser);
                    _context.Tenants.Remove(oldTenant);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    return BadRequest(new { message = "An account with this email already exists and is active or pending review." });
                }
            }

            // 4. Create local records (Transaction-like scope)
            var tenant = new Tenant
            {
                CompanyName = request.CompanyName,
                SubscriptionTier = plan?.Name ?? request.PlanTier,
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

            var user = new User
            {
                Name = request.Email,
                Email = request.Email, // FIX: set Email field
                FirstName = request.FirstName,
                LastName = request.LastName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
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
                PlanTier = tenant.SubscriptionTier,
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

            // 5. PayMongo API Call
            try
            {
                var client = _httpClientFactory.CreateClient("PayMongo");
                
                // Safety check for BaseAddress
                if (client.BaseAddress == null)
                {
                    client.BaseAddress = new Uri("https://api.paymongo.com/v1/");
                }

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
                            description = $"{planName} subscription for {request.CompanyName}",
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
                    // Rollback local records on API failure
                    _context.Invoices.Remove(invoice);
                    _context.Users.Remove(user);
                    _context.Tenants.Remove(tenant);
                    _context.PaymentSessions.Remove(paymentSession);
                    await _context.SaveChangesAsync();

                    return StatusCode((int)response.StatusCode, new { 
                        message = "PayMongo checkout creation failed.", 
                        details = responseBody,
                        hint = "Check if your Secret Key is correct and has access to Checkout Sessions."
                    });
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
                return StatusCode(500, new { message = "Critical failure during checkout session creation.", error = ex.Message });
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
