using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.DeptHead
{
    [Route("api/dept-head")]
    [ApiController]
    public class DeptHeadScenariosController : DeptHeadBaseController
    {
        public DeptHeadScenariosController(AppDbContext context) : base(context) { }

        // GET api/dept-head/scenarios — get all tenant-level scenarios
        [HttpGet("scenarios")]
        public async Task<IActionResult> GetScenarios()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var scenarios = await _context.BudgetScenarios
                .Where(s => s.TenantID == tenantId)
                .OrderByDescending(s => s.IsActive)
                .ThenBy(s => s.ScenarioID)
                .ToListAsync();

            return Ok(scenarios.Select(s => new
            {
                scenarioId = s.ScenarioID,
                scenarioName = s.ScenarioName,
                description = s.Description,
                multiplier = s.AdjustmentMultiplier,
                isActive = s.IsActive,
                createdAt = s.CreatedAt
            }));
        }

        // GET api/dept-head/scenarios/active — get currently active scenario
        [HttpGet("scenarios/active")]
        public async Task<IActionResult> GetActiveScenario()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var scenario = await _context.BudgetScenarios
                .Where(s => s.TenantID == tenantId && s.IsActive)
                .FirstOrDefaultAsync();

            if (scenario == null)
                return Ok(new { scenarioId = 0, scenarioName = "Base Case", multiplier = 1.0, isActive = true, description = "Standard operating budget." });

            return Ok(new
            {
                scenarioId = scenario.ScenarioID,
                scenarioName = scenario.ScenarioName,
                description = scenario.Description,
                multiplier = scenario.AdjustmentMultiplier,
                isActive = scenario.IsActive
            });
        }

        // GET api/dept-head/scenarios/preview?multiplier=0.8 — preview impact on dept proposals
        [HttpGet("scenarios/preview")]
        public async Task<IActionResult> PreviewScenario([FromQuery] decimal multiplier = 1.0m)
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();

            var user = await _context.Users.Include(u => u.Department).FirstOrDefaultAsync(u => u.UserID == userId);
            var deptId = user?.DepartmentID ?? 0;
            decimal budgetCap = user?.Department?.AnnualBudgetCap ?? 0;
            decimal adjustedBudget = budgetCap * multiplier;

            var proposals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && (p.DepartmentID == deptId || p.CreatedBy == userId))
                .Where(p => p.ProposalStatus != "Rejected")
                .OrderByDescending(p => p.TotalAmount)
                .ToListAsync();

            // Simulate freeze: Low priority frozen first if budget drops below threshold
            decimal cumulativeCost = 0;
            var impactList = proposals.Select(p =>
            {
                bool willFreeze = false;
                if (multiplier <= 0.8m && p.Priority == "Low") willFreeze = true;
                if (multiplier <= 0.7m && p.Priority == "High") willFreeze = true;
                if (!willFreeze) cumulativeCost += p.TotalAmount;

                return new
                {
                    proposalId = p.ProposalID,
                    title = p.Title,
                    priority = p.Priority,
                    status = p.ProposalStatus,
                    amount = p.TotalAmount,
                    willFreeze
                };
            }).ToList();

            return Ok(new
            {
                multiplier,
                originalBudget = budgetCap,
                adjustedBudget,
                reductionAmount = budgetCap - adjustedBudget,
                frozenCount = impactList.Count(x => x.willFreeze),
                activeCount = impactList.Count(x => !x.willFreeze),
                proposals = impactList
            });
        }
    }
}
