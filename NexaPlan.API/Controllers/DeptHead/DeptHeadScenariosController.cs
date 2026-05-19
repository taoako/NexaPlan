using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using NexaPlan.API.Helpers;
using System.Text.Json;

namespace NexaPlan.API.Controllers.DeptHead
{
    [Route("api/dept-head")]
    [ApiController]
    public class DeptHeadScenariosController : DeptHeadBaseController
    {
        public DeptHeadScenariosController(AppDbContext context) : base(context) { }

        // GET api/dept-head/scenarios — get all tenant-level scenarios (non-archived)
        [HttpGet("scenarios")]
        public async Task<IActionResult> GetScenarios()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var scenarios = await _context.BudgetScenarios
                .Where(s => s.TenantID == tenantId && !s.IsArchived)
                .OrderByDescending(s => s.IsActive)
                .ThenBy(s => s.CreatedAt)
                .ToListAsync();

            return Ok(scenarios.Select(s => new
            {
                scenarioId           = s.ScenarioID,
                title                = s.ScenarioName,
                adjustmentMultiplier = s.AdjustmentMultiplier,
                isActive             = s.IsActive,
                isArchived           = s.IsArchived
            }));
        }

        // GET api/dept-head/scenarios/active — get currently active scenario
        [HttpGet("scenarios/active")]
        public async Task<IActionResult> GetActiveScenario()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var scenario = await _context.BudgetScenarios
                .Where(s => s.TenantID == tenantId && s.IsActive && !s.IsArchived)
                .FirstOrDefaultAsync();

            if (scenario == null)
                return Ok(new { scenarioId = 0, title = "Base Case", adjustmentMultiplier = 1.0, isActive = true });

            return Ok(new
            {
                scenarioId           = scenario.ScenarioID,
                title                = scenario.ScenarioName,
                adjustmentMultiplier = scenario.AdjustmentMultiplier,
                isActive             = scenario.IsActive
            });
        }

        // GET api/dept-head/scenarios/impact?multiplier=0.65&fiscalYear=2026
        [HttpGet("scenarios/impact")]
        public async Task<IActionResult> GetScenarioImpact(
            [FromQuery] decimal multiplier = 1.0m,
            [FromQuery] int fiscalYear = 0)
        {
            var tenantId = GetTenantId();
            var userId   = GetUserId();
            if (tenantId == 0) return NoTenant();

            if (fiscalYear == 0) fiscalYear = DateTime.UtcNow.Year;

            // Try to resolve department from user record
            var deptId = await GetDepartmentIdAsync();

            // Resolve budget cap
            decimal currentBudget = 0;
            if (deptId > 0)
            {
                var allocation = await _context.DepartmentAllocations
                    .Where(a => a.TenantID == tenantId && a.DepartmentID == deptId && a.FiscalYear == fiscalYear)
                    .FirstOrDefaultAsync();

                if (allocation != null)
                    currentBudget = allocation.TotalAllocatedCap;
                else
                {
                    var dept = await _context.Departments.FindAsync(deptId);
                    currentBudget = dept?.AnnualBudgetCap ?? 0;
                }
            }

            decimal scenarioBudget = currentBudget * multiplier;

            // Fetch proposals — use DepartmentID if available, else fall back to CreatedBy
            List<NexaPlan.API.Models.BudgetProposal> proposals;
            if (deptId > 0)
            {
                proposals = await _context.BudgetProposals
                    .Where(p => p.TenantID == tenantId
                             && p.DepartmentID == deptId
                             && (p.ProposalStatus == "Draft" || p.ProposalStatus == "Pending" || p.ProposalStatus == "Approved"))
                    .ToListAsync();
            }
            else
            {
                // Fallback: proposals created by this user regardless of dept
                proposals = await _context.BudgetProposals
                    .Where(p => p.TenantID == tenantId
                             && p.CreatedBy == userId
                             && (p.ProposalStatus == "Draft" || p.ProposalStatus == "Pending" || p.ProposalStatus == "Approved"))
                    .ToListAsync();

                // Try to infer budget from the first proposal's department
                if (proposals.Any() && currentBudget == 0)
                {
                    var inferredDeptId = proposals.First().DepartmentID;
                    if (inferredDeptId > 0)
                    {
                        var alloc = await _context.DepartmentAllocations
                            .Where(a => a.TenantID == tenantId && a.DepartmentID == inferredDeptId && a.FiscalYear == fiscalYear)
                            .FirstOrDefaultAsync();
                        if (alloc != null)
                            currentBudget = alloc.TotalAllocatedCap;
                        else
                        {
                            var dept = await _context.Departments.FindAsync(inferredDeptId);
                            currentBudget = dept?.AnnualBudgetCap ?? 0;
                        }
                        scenarioBudget = currentBudget * multiplier;
                    }
                }
            }

            proposals = proposals
                .OrderBy(p => p.PriorityRank == 0 ? 4 : p.PriorityRank)
                .ToList();

            // Walk in priority order
            decimal runningTotal    = 0;
            decimal totalSurviving  = 0;
            decimal totalAtRisk     = 0;

            var proposalResults = proposals.Select(p =>
            {
                decimal amount = p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount;
                string scenarioStatus;

                if (runningTotal + amount <= scenarioBudget)
                {
                    scenarioStatus = "Survives";
                    runningTotal   += amount;
                    totalSurviving += amount;
                }
                else
                {
                    scenarioStatus = "AtRisk";
                    totalAtRisk   += amount;
                }

                return new
                {
                    proposalId      = p.ProposalID,
                    title           = p.Title,
                    requestedAmount = amount,
                    priorityRank    = p.PriorityRank == 0 ? 4 : p.PriorityRank,
                    status          = p.ProposalStatus,
                    scenarioStatus
                };
            }).ToList();

            return Ok(new
            {
                currentBudget        = Math.Round(currentBudget, 2),
                scenarioBudget       = Math.Round(scenarioBudget, 2),
                adjustmentMultiplier = multiplier,
                gap                  = Math.Round(scenarioBudget - currentBudget, 2),
                totalSurviving       = Math.Round(totalSurviving, 2),
                totalAtRisk          = Math.Round(totalAtRisk, 2),
                proposals            = proposalResults
            });
        }

        // POST api/dept-head/scenarios/pitch
        [HttpPost("scenarios/pitch")]
        public async Task<IActionResult> SubmitPitch([FromBody] ScenarioPitchDto req)
        {
            var deptId   = await GetDepartmentIdAsync();
            var tenantId = GetTenantId();
            var userId   = GetUserId();

            if (tenantId == 0) return NoTenant();
            if (userId   == 0) return NoUser();
            if (deptId == 0) return BadRequest(new { message = "User is not assigned to a department." });

            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (!TierFeatures.CanSubmitScenarioPitch(tenant?.SubscriptionTier ?? "Trial"))
                return StatusCode(402, new {
                    error = "Scenario pitching requires the Professional or Enterprise plan.",
                    upgradeRequired = true
                });

            var pitch = new ScenarioPitch
            {
                DepartmentId      = deptId,
                TenantId          = tenantId,
                ScenarioId        = req.ScenarioId,
                CustomMultiplier  = req.CustomMultiplier,
                PitchTitle        = req.PitchTitle,
                Justification     = req.Justification,
                PitchDecisions    = JsonSerializer.Serialize(req.ProposalDecisions),
                SubmittedByUserId = userId,
                Status            = "Pending Review"
            };

            _context.ScenarioPitches.Add(pitch);

            _context.AuditLogs.Add(new AuditLog
            {
                TenantID        = tenantId,
                UserID          = userId,
                ActionType      = "ScenarioPitchSubmitted",
                TargetResources = $"Scenario pitch '{req.PitchTitle}' submitted by department {deptId}",
                IPAddress       = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                TimeStamp       = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new { success = true, pitchId = pitch.PitchId });
        }

        // GET api/dept-head/scenarios/pitches
        [HttpGet("scenarios/pitches")]
        public async Task<IActionResult> GetMyPitches()
        {
            var deptId   = await GetDepartmentIdAsync();
            var tenantId = GetTenantId();

            var pitches = await _context.ScenarioPitches
                .Where(p => p.DepartmentId == deptId && p.TenantId == tenantId)
                .OrderByDescending(p => p.SubmittedAt)
                .Select(p => new
                {
                    pitchId = p.PitchId,
                    pitchTitle = p.PitchTitle,
                    status = p.Status,
                    justification = p.Justification,
                    submittedAt = p.SubmittedAt,
                    customMultiplier = p.CustomMultiplier,
                    scenarioTitle = p.ScenarioId != null
                        ? _context.BudgetScenarios
                            .Where(s => s.ScenarioID == p.ScenarioId)
                            .Select(s => s.ScenarioName)
                            .FirstOrDefault() ?? "Unknown Scenario"
                        : "Custom Scenario"
                })
                .ToListAsync();

            return Ok(pitches);
        }

        // GET api/dept-head/scenarios/preview?multiplier=0.8 — legacy preview (kept for backward compat)
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

    // ── DTOs ──────────────────────────────────────────────────────────────────────
    public class PitchDecisionDto
    {
        public int    ProposalId { get; set; }
        public string Decision   { get; set; } = "Keep"; // Keep | Defer | Cut
    }

    public class ScenarioPitchDto
    {
        public int?                   ScenarioId        { get; set; }
        public decimal                CustomMultiplier  { get; set; } = 1.0m;
        public string                 PitchTitle        { get; set; } = string.Empty;
        public string                 Justification     { get; set; } = string.Empty;
        public List<PitchDecisionDto> ProposalDecisions { get; set; } = new();
    }
}
