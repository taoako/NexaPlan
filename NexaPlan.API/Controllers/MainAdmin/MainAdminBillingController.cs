using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.MainAdmin
{
    [Route("api/main-admin")]
    [ApiController]
    public class MainAdminBillingController : MainAdminBaseController
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _clientFactory;

        public MainAdminBillingController(AppDbContext context, IConfiguration configuration, IHttpClientFactory clientFactory) : base(context)
        {
            _configuration = configuration;
            _clientFactory = clientFactory;
        }

        [HttpGet("billing")]
        public async Task<IActionResult> GetBilling()
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var tenant = await _context.Tenants.FindAsync(tenantId);
            var invoices = await _context.Invoices
                .Where(i => i.TenantID == tenantId)
                .OrderByDescending(i => i.InvoiceID)
                .Take(12)
                .ToListAsync();

            // 1. Find next pending invoice
            var nextInvoice = invoices.FirstOrDefault(i => !i.Status && i.DueDate >= DateTime.UtcNow);
            
            // 2. If no pending, estimate based on latest paid or tenant creation
            DateTime? nextDate = nextInvoice?.DueDate;
            if (nextDate == null)
            {
                var latestPaid = invoices.FirstOrDefault(i => i.Status);
                if (latestPaid != null)
                {
                    nextDate = latestPaid.BillingDate.AddMonths(1);
                }
                else if (tenant != null)
                {
                    nextDate = tenant.CreatedAt.AddMonths(1);
                }
            }

            return Ok(new
            {
                plan = tenant?.SubscriptionTier ?? "Unknown",
                status = tenant?.RegistrationStatus ?? "Unknown",
                nextBillingDate = nextDate,
                daysUntilDue = nextDate.HasValue
                    ? (int?)(nextDate.Value - DateTime.UtcNow).TotalDays
                    : null,
                invoices = invoices.Select(inv => new
                {
                    invoiceId = inv.InvoiceID,
                    invoiceNumber = $"INV-{inv.InvoiceID:D6}",
                    amount = inv.Amount,
                    status = inv.Status ? "Paid" : (inv.DueDate < DateTime.UtcNow ? "Overdue" : "Pending"),
                    dueDate = inv.DueDate,
                    paymentMethod = string.IsNullOrEmpty(inv.PaymentMethod) ? "—" : inv.PaymentMethod
                })
            });
        }

        // ── Upgrade or Renew Plan ──
        [HttpPost("billing/upgrade")]
        public async Task<IActionResult> UpgradePlan([FromBody] BillingActionDto request)
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null) return NotFound();

            var newTier = request.NewTier ?? tenant.SubscriptionTier;
            var planPrices = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase) {
                { "Starter", 49900_00 }, { "Professional", 149900_00 }, { "Enterprise", 399900_00 }
            };

            if (!planPrices.TryGetValue(newTier, out var amount))
                return BadRequest(new { message = $"Unknown plan tier: {newTier}" });

            // Create a PayMongo checkout
            var secretKey = _configuration["PayMongo:SecretKey"];
            if (string.IsNullOrWhiteSpace(secretKey))
                return BadRequest(new { message = "Payment gateway not configured." });

            var frontendBase = _configuration["Frontend:BaseUrl"];
            if (string.IsNullOrWhiteSpace(frontendBase))
                return BadRequest(new { message = "Frontend BaseUrl is not configured." });

            var client = _clientFactory.CreateClient("PayMongo");
            var authValue = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{secretKey}:"));
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", authValue);

            var payload = System.Text.Json.JsonSerializer.Serialize(new
            {
                data = new
                {
                    attributes = new
                    {
                        cancel_url = $"{frontendBase}/?payment=cancelled",
                        success_url = $"{frontendBase}/?payment=success",
                        payment_method_types = new[] { "card", "gcash", "paymaya" },
                        line_items = new[] { new { amount, currency = "PHP", name = $"NexaPlan {newTier} Plan", quantity = 1 } },
                        description = $"{newTier} plan {request.Action}",
                    }
                }
            });

            var response = await client.PostAsync("checkout_sessions",
                new System.Net.Http.StringContent(payload, System.Text.Encoding.UTF8, "application/json"));

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, new { message = "Could not create checkout session." });

            using var doc = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            var checkoutUrl = doc.RootElement.GetProperty("data").GetProperty("attributes").GetProperty("checkout_url").GetString();

            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = $"BILLING_{request.Action.ToUpper()}", TargetResources = $"{newTier} plan", IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", TimeStamp = DateTime.UtcNow });
            await _context.SaveChangesAsync();

            return Ok(new { checkoutUrl, message = $"Redirecting to checkout for {newTier} plan." });
        }

        // ── Cancel Plan ──
        [HttpPost("billing/cancel")]
        public async Task<IActionResult> CancelPlan()
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null) return NotFound();

            tenant.RegistrationStatus = "CancellationPending";

            _context.AuditLogs.Add(new AuditLog { TenantID = tenantId, UserID = 0, ActionType = "BILLING_CANCEL_REQUESTED", TargetResources = tenant.CompanyName, IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", TimeStamp = DateTime.UtcNow });
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cancellation request submitted. Your plan will remain active until the end of the current billing cycle. Contact support to undo this." });
        }
    }
}
