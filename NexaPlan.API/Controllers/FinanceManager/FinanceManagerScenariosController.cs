using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.FinanceManager
{
    [Route("api/finance-manager")]
    [ApiController]
    public class FinanceManagerScenariosController : FinanceManagerBaseController
    {
        public FinanceManagerScenariosController(AppDbContext context) : base(context) { }

        private static int NormalizePriorityRank(BudgetProposal proposal)
        {
            if (proposal.PriorityRank > 0) return proposal.PriorityRank;

            return proposal.Priority switch
            {
                "Mission Critical" => 1,
                "High" => 2,
                "Low" => 3,
                _ => 4
            };
        }

        private static decimal ResolveRequestedAmount(BudgetProposal proposal)
        {
            return proposal.RequestedAmount > 0 ? proposal.RequestedAmount : proposal.TotalAmount;
        }

        [HttpGet("scenarios")]
        public async Task<IActionResult> GetScenarios()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var scenarios = await _context.BudgetScenarios
                .Where(s => s.TenantID == tenantId)
                .OrderByDescending(s => s.IsActive)
                .ThenBy(s => s.CreatedAt)
                .ToListAsync();

            if (!scenarios.Any(s => s.ScenarioName == "Base Case"))
            {
                var baseScenario = new BudgetScenario
                {
                    TenantID = tenantId,
                    ScenarioName = "Base Case",
                    Description = "Standard operating budget with approved allocations and normal growth assumptions.",
                    AdjustmentMultiplier = 1.0m,
                    IsActive = true,
                    CreatedBy = GetUserId()
                };
                _context.BudgetScenarios.Add(baseScenario);
                await _context.SaveChangesAsync();
                scenarios.Insert(0, baseScenario);
            }

            return Ok(scenarios.Select(s => new
            {
                id = s.ScenarioID,
                name = s.ScenarioName,
                multiplier = s.AdjustmentMultiplier,
                isActive = s.IsActive,
                desc = s.Description
            }));
        }

        [HttpPost("scenarios")]
        public async Task<IActionResult> CreateScenario([FromBody] CreateScenarioRequest req)
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();
            if (userId == 0) return NoUser();

            var scenario = new BudgetScenario
            {
                TenantID = tenantId,
                ScenarioName = req.Name,
                Description = req.Desc ?? "",
                AdjustmentMultiplier = req.Multiplier,
                IsActive = false, // newly created scenarios are inactive by default
                CreatedBy = userId
            };

            _context.BudgetScenarios.Add(scenario);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Scenario created successfully.", scenarioId = scenario.ScenarioID });
        }

        [HttpPost("scenarios/{id:int}/activate")]
        public async Task<IActionResult> ActivateScenario(int id)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var scenarioToActivate = await _context.BudgetScenarios.FirstOrDefaultAsync(s => s.ScenarioID == id && s.TenantID == tenantId);
            if (scenarioToActivate == null) return NotFound(new { message = "Scenario not found." });

            // Deactivate all
            var allScenarios = await _context.BudgetScenarios.Where(s => s.TenantID == tenantId).ToListAsync();
            foreach (var s in allScenarios)
            {
                s.IsActive = false;
            }

            // Activate target
            scenarioToActivate.IsActive = true;

            // Trigger the auto-freeze logic based on priority if it's a reduction
            if (scenarioToActivate.AdjustmentMultiplier < 1.0m)
            {
                var fiscalYear = DateTime.UtcNow.Year;
                var allocations = await _context.DepartmentAllocations
                    .Where(a => a.TenantID == tenantId && a.FiscalYear == fiscalYear)
                    .ToDictionaryAsync(a => a.DepartmentID, a => a.TotalAllocatedCap);

                var departments = await _context.Departments
                    .Where(d => d.TenantID == tenantId)
                    .Select(d => new { d.DepartmentID, d.AnnualBudgetCap })
                    .ToListAsync();

                foreach (var dept in departments)
                {
                    var baseCap = allocations.ContainsKey(dept.DepartmentID)
                        ? allocations[dept.DepartmentID]
                        : dept.AnnualBudgetCap;

                    var scenarioCap = baseCap * scenarioToActivate.AdjustmentMultiplier;

                    var proposals = await _context.BudgetProposals
                        .Where(p => p.TenantID == tenantId && p.DepartmentID == dept.DepartmentID && (p.ProposalStatus == "Pending" || p.ProposalStatus == "Approved"))
                        .ToListAsync();

                    var ordered = proposals
                        .OrderBy(NormalizePriorityRank)
                        .ThenBy(p => p.SubmittedAt)
                        .ThenBy(p => p.ProposalID)
                        .ToList();

                    decimal runningTotal = 0;
                    bool capExceeded = false;

                    foreach (var proposal in ordered)
                    {
                        if (capExceeded)
                        {
                            proposal.ProposalStatus = "Frozen";
                            continue;
                        }

                        runningTotal += ResolveRequestedAmount(proposal);

                        if (runningTotal > scenarioCap)
                        {
                            capExceeded = true;
                        }
                    }
                }
            }
            else
            {
                // If multiplier is >= 1, we might want to unfreeze them.
                // Assuming they go back to Pending if they were frozen.
                var frozenProposals = await _context.BudgetProposals
                    .Where(p => p.TenantID == tenantId && p.ProposalStatus == "Frozen")
                    .ToListAsync();
                foreach (var p in frozenProposals)
                {
                    p.ProposalStatus = "Pending";
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Scenario activated successfully." });
        }
    }

    public record CreateScenarioRequest(string Name, decimal Multiplier, string? Desc);
}
