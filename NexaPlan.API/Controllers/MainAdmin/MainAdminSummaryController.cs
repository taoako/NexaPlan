using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Controllers.MainAdmin;

namespace NexaPlan.API.Controllers.MainAdmin
{
    [Route("api/main-admin")]
    [ApiController]
    public class MainAdminSummaryController : MainAdminBaseController
    {
        public MainAdminSummaryController(AppDbContext context) : base(context) { }

        private static int GetSeatLimit(string tier) => tier?.ToLower() switch {
            "starter" => 15,
            "professional" => 50,
            "enterprise" => 200,
            "trial" => 10,
            _ => 10
        };

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null) return NotFound(new { message = "Tenant not found." });

            var users = await _context.Users.Where(u => u.TenantID == tenantId).ToListAsync();
            var depts = await _context.Departments.Where(d => d.TenantID == tenantId).ToListAsync();
            var roles = await _context.Roles.ToListAsync();
            var settings = await _context.TenantSettings.FirstOrDefaultAsync(s => s.TenantID == tenantId);

            var roleDistribution = users
                .Where(u => u.IsActive && !u.IsLocked)
                .GroupBy(u => u.RoleID)
                .Select(g => new {
                    roleId = g.Key,
                    roleName = roles.FirstOrDefault(r => r.RoleID == g.Key)?.RoleName ?? "Unknown",
                    count = g.Count()
                }).ToList();

            var recentLogs = await _context.AuditLogs
                .Where(l => l.TenantID == tenantId)
                .OrderByDescending(l => l.TimeStamp)
                .Take(10)
                .ToListAsync();

            var nextInvoice = await _context.Invoices
                .Where(i => i.TenantID == tenantId && !i.Status && i.DueDate >= DateTime.UtcNow)
                .OrderBy(i => i.DueDate)
                .FirstOrDefaultAsync();

            // Department budget summaries for quick-toggles on overview
            var deptSummaries = depts.Select(d => {
                var head = users.FirstOrDefault(u => u.UserID == d.HeadUserID);
                return new {
                    departmentId = d.DepartmentID,
                    name = d.DepartmentName,
                    headName = head?.Name ?? "Unassigned",
                    memberCount = users.Count(u => u.DepartmentID == d.DepartmentID),
                    budgetCap = d.AnnualBudgetCap,
                    budgetAccess = d.AnnualBudgetCap > 0
                };
            }).ToList();

            return Ok(new {
                tenantName = tenant.CompanyName,
                orgType = tenant.OrgType,
                subscriptionTier = tenant.SubscriptionTier,
                activeUsers = users.Count(u => u.IsActive && !u.IsLocked),
                totalSeats = GetSeatLimit(tenant.SubscriptionTier),
                totalDepartments = depts.Count,
                roleDistribution,
                mfaEnabled = settings?.RequireMFA ?? false,
                nextBillingDate = nextInvoice?.DueDate,
                departments = deptSummaries,
                recentActivity = recentLogs.Select(l => new {
                    logId = l.LogID,
                    action = l.ActionType,
                    target = l.TargetResources,
                    time = l.TimeStamp
                })
            });
        }

        [HttpGet("roles")]
        public async Task<IActionResult> GetRoles()
        {
            // Exclude Super Admin (1); Finance Manager (4) can't be dept-assigned so flag it
            var roles = await _context.Roles
                .Where(r => r.RoleID != 1)
                .Select(r => new { roleId = r.RoleID, roleName = r.RoleName, requiresDepartment = r.RoleID != 3 })
                .ToListAsync();
            return Ok(roles);
        }
    }
}
