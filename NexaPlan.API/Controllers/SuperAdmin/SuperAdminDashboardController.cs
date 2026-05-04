using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.SuperAdmin
{
    [Route("api/super-admin")]
    [ApiController]
    public class SuperAdminDashboardController : SuperAdminBaseController
    {
        public SuperAdminDashboardController(AppDbContext context, IConfiguration configuration) : base(context, configuration) { }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromServices] IHttpClientFactory clientFactory)
        {
            await SyncPendingPaymentsAsync(clientFactory);
            var tenants = await _context.Tenants.ToListAsync();
            var users = await _context.Users.Where(u => u.RoleID == 2).ToListAsync();
            var invoices = await _context.Invoices.ToListAsync();
            var trials = await _context.TrialRequests.Where(t => t.Status == "Pending").ToListAsync();
            var activeTenants = tenants.Where(t => t.IsActive && !t.IsArchived).ToList();

            var tierPrices = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
            {
                { "Starter", 4950m }, { "Professional", 12900m }, { "Enterprise", 29900m }, { "Trial", 0m }
            };

            var totalMrr = activeTenants.Sum(t => tierPrices.TryGetValue(t.SubscriptionTier, out var price) ? price : 0m);
            var overdueInvoices = invoices.Where(i => !i.Status && i.DueDate < DateTime.UtcNow).ToList();

            return Ok(new SuperAdminSummaryDto(
                TotalTenants: tenants.Count(t => !t.IsArchived),
                ActiveTenants: activeTenants.Count,
                TrialAccounts: tenants.Count(t => t.RegistrationStatus == "Trial" || t.SubscriptionTier == "Trial"),
                OverdueAccounts: overdueInvoices.Select(i => i.TenantID).Distinct().Count(),
                TotalMrr: totalMrr,
                TotalAdmins: users.Count,
                MfaEnabledAdmins: users.Count(u => u.MfaEnabled),
                LockedAdmins: users.Count(u => u.IsLocked),
                PendingTrials: trials.Count,
                TotalInvoices: invoices.Count,
                OverdueAmount: overdueInvoices.Sum(i => i.Amount)
            ));
        }
    }
}
