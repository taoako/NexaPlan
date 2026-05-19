using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using System.Text.Json;

namespace NexaPlan.API.Controllers.SuperAdmin
{
    /// <summary>Shared base for all Super Admin controllers.</summary>
    [Authorize]
    public abstract class SuperAdminBaseController : ControllerBase
    {
        protected readonly AppDbContext _context;
        protected readonly IConfiguration _configuration;

        protected SuperAdminBaseController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        protected static string FormatTimeAgo(DateTime dt)
        {
            var span = DateTime.UtcNow - dt;
            if (span.TotalMinutes < 1) return "Just now";
            if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes}m ago";
            if (span.TotalHours < 24) return $"{(int)span.TotalHours}h ago";
            if (span.TotalDays < 7) return $"{(int)span.TotalDays}d ago";
            return dt.ToString("MMM dd, yyyy");
        }

        /// <summary>Bug Fix: Reads X-Forwarded-For before falling back to RemoteIpAddress.</summary>
        protected string GetClientIp()
        {
            var forwarded = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwarded))
                return forwarded.Split(',')[0].Trim();
            var realIp = HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(realIp))
                return realIp;
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
        }

        /// <summary>Polls PayMongo and marks paid invoices, activates tenants.</summary>
        protected async Task SyncPendingPaymentsAsync(IHttpClientFactory clientFactory)
        {
            // Fix stuck tenants with paid invoices
            var stuckTenants = await _context.Tenants
                .Where(t => (t.RegistrationStatus == "Pending" || t.RegistrationStatus == "PendingPayment")
                         && _context.Invoices.Any(i => i.TenantID == t.TenantID && i.Status))
                .ToListAsync();

            foreach (var t in stuckTenants)
            {
                t.IsActive = true; t.RegistrationStatus = "Active";
                var u = await _context.Users.FirstOrDefaultAsync(user => user.TenantID == t.TenantID && user.RoleID == 2);
                if (u != null) { u.IsActive = true; u.IsLocked = false; u.FailedLoginAttempts = 0; }
            }
            if (stuckTenants.Any()) await _context.SaveChangesAsync();

            var pendingInvoices = await _context.Invoices.Where(i => !i.Status).ToListAsync();
            if (!pendingInvoices.Any()) return;

            var secretKey = _configuration["PayMongo:SecretKey"];
            var dbSecret = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == "PayMongoSecret");
            if (!string.IsNullOrWhiteSpace(dbSecret?.ConfigValue)) secretKey = dbSecret.ConfigValue;
            if (string.IsNullOrWhiteSpace(secretKey)) return;

            var client = clientFactory.CreateClient("PayMongo");
            var auth = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{secretKey}:"));
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", auth);

            bool changed = false;
            foreach (var invoice in pendingInvoices)
            {
                var session = await _context.PaymentSessions.OrderByDescending(p => p.PaymentSessionID)
                    .FirstOrDefaultAsync(p => p.TenantID == invoice.TenantID);
                if (session == null || string.IsNullOrEmpty(session.PayMongoCheckoutID)) continue;

                try
                {
                    var response = await client.GetAsync($"checkout_sessions/{session.PayMongoCheckoutID}");
                    if (!response.IsSuccessStatusCode) continue;

                    using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                    var attrs = doc.RootElement.GetProperty("data").GetProperty("attributes");
                    var payMongoStatus = "pending";
                    JsonElement? firstPayment = null;

                    if (attrs.TryGetProperty("payments", out var payments) && payments.GetArrayLength() > 0)
                    { payMongoStatus = "paid"; firstPayment = payments[0]; }
                    else if (attrs.TryGetProperty("payment_intent", out var pi) && pi.TryGetProperty("attributes", out var piAttr))
                    {
                        if (piAttr.TryGetProperty("status", out var status) && status.GetString() == "succeeded")
                        {
                            payMongoStatus = "paid";
                            if (piAttr.TryGetProperty("payments", out var piPays) && piPays.GetArrayLength() > 0)
                                firstPayment = piPays[0];
                        }
                    }

                    if (payMongoStatus == "paid")
                    {
                        string paymentMethod = "PayMongo", paymentId = "";
                        if (firstPayment.HasValue)
                        {
                            if (firstPayment.Value.TryGetProperty("attributes", out var pAttr))
                                paymentMethod = pAttr.GetProperty("source").GetProperty("type").GetString() ?? "PayMongo";
                            paymentId = firstPayment.Value.GetProperty("id").GetString() ?? "";
                        }
                        invoice.Status = true; invoice.StatusLabel = "Paid";
                        invoice.PaymentMethod = paymentMethod; invoice.PayMongoPaymentIntentId = paymentId;
                        session.Status = "Paid"; session.PaidAt = DateTime.UtcNow;

                        var tenant = await _context.Tenants.FindAsync(invoice.TenantID);
                        if (tenant != null) { tenant.IsActive = true; tenant.RegistrationStatus = "Active"; }

                        var user = await _context.Users.FirstOrDefaultAsync(u => u.TenantID == invoice.TenantID && u.RoleID == 2);
                        if (user != null) { user.IsActive = true; user.IsLocked = false; user.FailedLoginAttempts = 0; }
                        changed = true;
                    }
                }
                catch { }
            }
            if (changed) await _context.SaveChangesAsync();
        }
    }
}
