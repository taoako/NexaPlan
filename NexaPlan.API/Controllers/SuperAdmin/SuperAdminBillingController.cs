using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.SuperAdmin
{
    [Route("api/super-admin")]
    [ApiController]
    public class SuperAdminBillingController : SuperAdminBaseController
    {
        public SuperAdminBillingController(AppDbContext context, IConfiguration configuration) : base(context, configuration) { }

        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices([FromServices] IHttpClientFactory clientFactory)
        {
            await SyncPendingPaymentsAsync(clientFactory);
            var tenants = await _context.Tenants.ToDictionaryAsync(t => t.TenantID, t => t);
            var invoices = await _context.Invoices.OrderByDescending(i => i.InvoiceID).ToListAsync();

            var result = invoices.Select(inv =>
            {
                tenants.TryGetValue(inv.TenantID, out var tenant);
                var status = inv.Status ? "Paid" : (inv.DueDate < DateTime.UtcNow ? "Overdue" : "Pending");
                if (!string.IsNullOrEmpty(inv.StatusLabel) && inv.StatusLabel == "Refunded") status = "Refunded";

                return new SuperAdminInvoiceDto(
                    inv.InvoiceID, $"INV-{inv.InvoiceID:D6}", inv.TenantID,
                    tenant?.CompanyName ?? "Unknown", inv.Amount,
                    string.IsNullOrEmpty(inv.PaymentMethod) ? "PayMongo" : inv.PaymentMethod,
                    inv.PayMongoPaymentIntentId, inv.DueDate, status,
                    status == "Paid" ? "green" : status == "Overdue" ? "red" : status == "Refunded" ? "gray" : "yellow"
                );
            }).ToList();

            return Ok(result);
        }

        [HttpPost("invoices/sync")]
        public async Task<IActionResult> SyncInvoices([FromServices] IHttpClientFactory clientFactory)
        {
            var pendingInvoices = await _context.Invoices.Where(i => !i.Status).ToListAsync();
            if (!pendingInvoices.Any()) return Ok(new { message = "All invoices are up to date." });

            var secretKey = _configuration["PayMongo:SecretKey"];
            var dbSecret = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == "PayMongoSecret");
            if (!string.IsNullOrWhiteSpace(dbSecret?.ConfigValue)) secretKey = dbSecret.ConfigValue;
            if (string.IsNullOrWhiteSpace(secretKey)) return BadRequest(new { message = "PayMongo Secret Key not configured." });

            var client = clientFactory.CreateClient();
            client.BaseAddress = new Uri("https://api.paymongo.com/v1/");
            var auth = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{secretKey}:"));
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", auth);

            int syncedCount = 0;
            foreach (var invoice in pendingInvoices)
            {
                var session = await _context.PaymentSessions.OrderByDescending(p => p.PaymentSessionID)
                    .FirstOrDefaultAsync(p => p.TenantID == invoice.TenantID);
                if (session == null || string.IsNullOrEmpty(session.PayMongoCheckoutID)) continue;

                try
                {
                    var response = await client.GetAsync($"checkout_sessions/{session.PayMongoCheckoutID}");
                    if (!response.IsSuccessStatusCode) continue;

                    using var doc = System.Text.Json.JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                    var attrs = doc.RootElement.GetProperty("data").GetProperty("attributes");
                    var paid = attrs.TryGetProperty("payments", out var payments) && payments.GetArrayLength() > 0;

                    if (paid)
                    {
                        var pAttr = payments[0].GetProperty("attributes");
                        var paymentMethod = pAttr.GetProperty("source").GetProperty("type").GetString();
                        invoice.Status = true; invoice.StatusLabel = "Paid";
                        invoice.PaymentMethod = paymentMethod ?? "PayMongo";
                        invoice.PayMongoPaymentIntentId = pAttr.GetProperty("id").GetString() ?? "";
                        session.Status = "Paid"; session.PaidAt = DateTime.UtcNow;

                        var tenant = await _context.Tenants.FindAsync(invoice.TenantID);
                        if (tenant != null) { tenant.IsActive = true; tenant.RegistrationStatus = "Active"; }

                        var user = await _context.Users.FirstOrDefaultAsync(u => u.TenantID == invoice.TenantID && u.RoleID == 2);
                        if (user != null) { user.IsActive = true; user.IsLocked = false; user.FailedLoginAttempts = 0; }
                        syncedCount++;
                    }
                }
                catch { }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Synced {syncedCount} invoices successfully." });
        }

        [HttpPut("invoices/{id:int}/refund")]
        public async Task<IActionResult> RefundInvoice(int id, [FromQuery] decimal? partialAmount = null)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null) return NotFound();
            invoice.StatusLabel = "Refunded"; invoice.Status = false;
            if (partialAmount.HasValue && partialAmount.Value < invoice.Amount)
            { invoice.Amount -= partialAmount.Value; invoice.StatusLabel = "Partial Refund"; }
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Refund processed for INV-{id:D6}." });
        }
    }
}
