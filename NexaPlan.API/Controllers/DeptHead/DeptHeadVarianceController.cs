using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.DeptHead
{
    [Route("api/dept-head")]
    [ApiController]
    public class DeptHeadVarianceController : DeptHeadBaseController
    {
        public DeptHeadVarianceController(AppDbContext context) : base(context) { }

        // GET api/dept-head/variance?period=FY2026|QTD|MTD
        [HttpGet("variance")]
        public async Task<IActionResult> GetVariance([FromQuery] string period = "FY2026")
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();

            var user = await _context.Users.Include(u => u.Department).FirstOrDefaultAsync(u => u.UserID == userId);
            var dept = user?.Department;
            if (dept == null) return Ok(new { rows = Array.Empty<object>(), summary = new { } });

            // Filter approved proposals by time period
            var now = DateTime.UtcNow;
            var approvedProposals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.DepartmentID == dept.DepartmentID && p.ProposalStatus == "Approved")
                .ToListAsync();

            IEnumerable<NexaPlan.API.Models.BudgetProposal> filtered = period switch
            {
                "MTD" => approvedProposals.Where(p => p.UpdatedAt.Year == now.Year && p.UpdatedAt.Month == now.Month),
                "QTD" => approvedProposals.Where(p => p.UpdatedAt.Year == now.Year && ((p.UpdatedAt.Month - 1) / 3) == ((now.Month - 1) / 3)),
                _ => approvedProposals.Where(p => p.FiscalYear == now.Year)
            };

            // Get line items for these proposals and group by category
            var proposalIds = filtered.Select(p => p.ProposalID).ToList();
            var lineItems = await _context.LineItems
                .Where(li => proposalIds.Contains(li.ProposalID))
                .ToListAsync();

            // Group by category with hardcoded budgeted amounts per dept budget cap
            decimal budgetCap = dept.AnnualBudgetCap;
            var categoryGroups = lineItems
                .GroupBy(li => string.IsNullOrWhiteSpace(li.Category) ? "Uncategorized" : li.Category)
                .Select(g =>
                {
                    decimal actual = g.Sum(li => li.Quantity * li.UnitCost);
                    // Budget weight: proportional split of dept budget cap by category
                    decimal budgeted = budgetCap > 0 ? budgetCap * GetCategoryWeight(g.Key) : actual * 1.2m;
                    decimal variance = budgeted - actual;
                    return new
                    {
                        category = g.Key,
                        budgeted = Math.Round(budgeted, 2),
                        actual = Math.Round(actual, 2),
                        variance = Math.Round(variance, 2),
                        isUnder = variance >= 0
                    };
                }).ToList();

            // If no line items, fallback to proposal-level categories
            if (!categoryGroups.Any())
            {
                categoryGroups = filtered.GroupBy(p => p.Category).Select(g =>
                {
                    decimal actual = g.Sum(p => p.TotalAmount);
                    decimal budgeted = budgetCap > 0 ? budgetCap * GetCategoryWeight(g.Key) : actual * 1.2m;
                    decimal variance = budgeted - actual;
                    return new
                    {
                        category = g.Key,
                        budgeted = Math.Round(budgeted, 2),
                        actual = Math.Round(actual, 2),
                        variance = Math.Round(variance, 2),
                        isUnder = variance >= 0
                    };
                }).ToList();
            }

            decimal totalBudgeted = categoryGroups.Sum(r => r.budgeted);
            decimal totalActual = categoryGroups.Sum(r => r.actual);
            decimal totalVariance = totalBudgeted - totalActual;

            return Ok(new
            {
                period,
                departmentName = dept.DepartmentName,
                allocatedBudget = budgetCap,
                rows = categoryGroups,
                summary = new
                {
                    totalBudgeted = Math.Round(totalBudgeted, 2),
                    totalActual = Math.Round(totalActual, 2),
                    totalVariance = Math.Round(totalVariance, 2),
                    isUnder = totalVariance >= 0
                }
            });
        }

        private static decimal GetCategoryWeight(string category) => category.ToLower() switch
        {
            "hardware" or "equipment" => 0.30m,
            "software" or "software licenses" => 0.25m,
            "cloud services" => 0.20m,
            "training" or "training & development" => 0.10m,
            "services" or "professional services" => 0.10m,
            _ => 0.05m
        };
    }
}
