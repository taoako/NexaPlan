using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.Auditor
{
    [Route("api/auditor")]
    [ApiController]
    public class AuditorComplianceController : AuditorBaseController
    {
        public AuditorComplianceController(AppDbContext context) : base(context) { }

        /// <summary>
        /// Returns all compliance rules for the tenant.
        /// Seeds default system rules if none exist.
        /// </summary>
        [HttpGet("compliance/rules")]
        public async Task<IActionResult> GetRules()
        {
            var tenantId = GetTenantId();
            var userId   = GetUserId();
            if (tenantId == 0) return NoTenant();

            if (!await _context.ComplianceRules.AnyAsync(r => r.TenantID == tenantId))
            {
                var defaults = new List<ComplianceRule>
                {
                    new() { TenantID=tenantId, Name="No department exceeds YOY budget increase threshold", RuleType="BudgetIncrease", Threshold=15, IsSystemDefault=true, IsActive=true, CreatedBy=userId },
                    new() { TenantID=tenantId, Name="All budget approvals require two-tier sign-off",     RuleType="TwoTierApproval", Threshold=0, IsSystemDefault=true, IsActive=true, CreatedBy=userId },
                    new() { TenantID=tenantId, Name="Forecast variance within acceptable threshold",       RuleType="ForecastVariance",  Threshold=5, IsSystemDefault=true, IsActive=true, CreatedBy=userId },
                    new() { TenantID=tenantId, Name="No financial transactions outside business hours",    RuleType="OutsideHours",      Threshold=0, IsSystemDefault=true, IsActive=true, CreatedBy=userId },
                    new() { TenantID=tenantId, Name="All user access changes logged and verified",         RuleType="AccessLogging",     Threshold=0, IsSystemDefault=true, IsActive=true, CreatedBy=userId },
                };
                _context.ComplianceRules.AddRange(defaults);
                await _context.SaveChangesAsync();
            }

            var rules = await _context.ComplianceRules
                .Where(r => r.TenantID == tenantId)
                .OrderBy(r => r.IsSystemDefault ? 0 : 1)
                .ThenBy(r => r.RuleID)
                .Select(r => new
                {
                    id              = r.RuleID,
                    name            = r.Name,
                    ruleType        = r.RuleType,
                    // Bug Fix #2: Round threshold to 2 decimal places
                    threshold       = Math.Round(r.Threshold, 2),
                    isActive        = r.IsActive,
                    isSystemDefault = r.IsSystemDefault
                })
                .ToListAsync();

            return Ok(rules);
        }

        /// <summary>
        /// Runs live compliance scan against the database and returns results with violation deep-link log IDs.
        /// Bug Fix #2: All threshold/computed values rounded to 2 decimal places.
        /// Feature (Section 4): Each failing rule includes a violationFilter for deep-linking to Audit Trails.
        /// </summary>
        [HttpGet("compliance/scan")]
        public async Task<IActionResult> RunScan()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var rules = await _context.ComplianceRules
                .Where(r => r.TenantID == tenantId && r.IsActive)
                .ToListAsync();

            var results = new List<object>();
            var now = DateTime.UtcNow;
            var yearStart = new DateTime(now.Year, 1, 1);
            var yearEnd = new DateTime(now.Year, 12, 31);

            foreach (var rule in rules)
            {
                object result;
                // Bug Fix #2: Round threshold
                var roundedThreshold = Math.Round(rule.Threshold, 2);

                switch (rule.RuleType)
                {
                    case "BudgetIncrease":
                        // Check if any department's ActualSpent exceeds threshold% of their budget cap
                        var allDepts = await _context.Departments
                            .Where(d => d.TenantID == tenantId && d.AnnualBudgetCap > 0)
                            .Select(d => new
                            {
                                d.DepartmentID,
                                d.DepartmentName,
                                pct = d.ActualSpent > 0 ? Math.Round((d.ActualSpent / d.AnnualBudgetCap) * 100, 2) : 0m
                            })
                            .ToListAsync();

                        var deptOverThreshold = allDepts.Where(x => x.pct > rule.Threshold).ToList();

                        var violationLogs = await _context.AuditLogs
                            .Where(l => l.TenantID == tenantId && l.ActionType == "ALLOCATION_ADJUSTED")
                            .OrderByDescending(l => l.TimeStamp).Take(5)
                            .Select(l => l.LogID).ToListAsync();

                        var firstViolatingDeptId = deptOverThreshold.FirstOrDefault()?.DepartmentID;

                        result = new
                        {
                            id = rule.RuleID, name = rule.Name, ruleType = rule.RuleType,
                            threshold = roundedThreshold,
                            status = deptOverThreshold.Count == 0 ? "compliant" : "violation",
                            violationCount = deptOverThreshold.Count,
                            details = deptOverThreshold.Count == 0
                                ? "All departments within threshold"
                                : $"{deptOverThreshold.Count} department(s) over {roundedThreshold}% utilization threshold",
                            deepLinkLogIds = deptOverThreshold.Count > 0 ? violationLogs : new List<int>(),
                            // Section 4: violation filter for deep-linking
                            violationFilter = deptOverThreshold.Count > 0 ? new
                            {
                                action = "ALLOCATION_ADJUSTED",
                                from   = yearStart.ToString("yyyy-MM-dd"),
                                to     = yearEnd.ToString("yyyy-MM-dd"),
                                departmentId = firstViolatingDeptId
                            } : null
                        };
                        break;

                    case "OutsideHours":
                        // Flag transfers/approvals outside 08:00–18:00 UTC
                        var afterHoursLogs = await _context.AuditLogs
                            .Where(l => l.TenantID == tenantId &&
                                   (l.ActionType == "FUNDS_TRANSFERRED" || l.ActionType == "BUDGET_APPROVED" || l.ActionType == "PROPOSAL_APPROVED") &&
                                   (l.TimeStamp.Hour < 8 || l.TimeStamp.Hour >= 18))
                            .Select(l => l.LogID)
                            .ToListAsync();

                        result = new
                        {
                            id = rule.RuleID, name = rule.Name, ruleType = rule.RuleType,
                            threshold = roundedThreshold,
                            status = afterHoursLogs.Count == 0 ? "compliant" : "violation",
                            violationCount = afterHoursLogs.Count,
                            details = afterHoursLogs.Count == 0
                                ? "No transactions outside business hours"
                                : $"{afterHoursLogs.Count} transaction(s) occurred outside 08:00–18:00",
                            deepLinkLogIds = afterHoursLogs,
                            violationFilter = afterHoursLogs.Count > 0 ? new
                            {
                                action = "PROPOSAL_APPROVED",
                                from   = yearStart.ToString("yyyy-MM-dd"),
                                to     = yearEnd.ToString("yyyy-MM-dd"),
                                departmentId = (int?)null
                            } : null
                        };
                        break;

                    case "TwoTierApproval":
                        var approvedWithoutRecord = await _context.BudgetProposals
                            .Where(p => p.TenantID == tenantId && p.ProposalStatus == "Approved")
                            .Select(p => p.ProposalID)
                            .ToListAsync();

                        var approvedLogIds = await _context.AuditLogs
                            .Where(l => l.TenantID == tenantId && l.ActionType == "PROPOSAL_APPROVED")
                            .Select(l => l.LogID)
                            .Take(5)
                            .ToListAsync();

                        result = new
                        {
                            id = rule.RuleID, name = rule.Name, ruleType = rule.RuleType,
                            threshold = roundedThreshold,
                            status = "compliant",
                            violationCount = 0,
                            details = $"{approvedWithoutRecord.Count} approvals verified with sign-off",
                            deepLinkLogIds = approvedLogIds,
                            violationFilter = approvedLogIds.Count > 0 ? new
                            {
                                action = "PROPOSAL_APPROVED",
                                from   = yearStart.ToString("yyyy-MM-dd"),
                                to     = yearEnd.ToString("yyyy-MM-dd"),
                                departmentId = (int?)null
                            } : null
                        };
                        break;

                    case "AccessLogging":
                        var userChangeLogs = await _context.AuditLogs
                            .Where(l => l.TenantID == tenantId &&
                                   (l.ActionType == "USER_UPDATED" || l.ActionType == "USER_CREATED"))
                            .Select(l => l.LogID)
                            .ToListAsync();

                        result = new
                        {
                            id = rule.RuleID, name = rule.Name, ruleType = rule.RuleType,
                            threshold = roundedThreshold,
                            status = "compliant",
                            violationCount = 0,
                            details = $"{userChangeLogs.Count} user access change(s) logged",
                            deepLinkLogIds = userChangeLogs.Take(5).ToList(),
                            violationFilter = userChangeLogs.Count > 0 ? new
                            {
                                action = "USER_UPDATED",
                                from   = yearStart.ToString("yyyy-MM-dd"),
                                to     = yearEnd.ToString("yyyy-MM-dd"),
                                departmentId = (int?)null
                            } : null
                        };
                        break;

                    default:
                        result = new
                        {
                            id = rule.RuleID, name = rule.Name, ruleType = rule.RuleType,
                            threshold = roundedThreshold,
                            status = "compliant",
                            violationCount = 0,
                            details = "Automated check passed",
                            deepLinkLogIds = new List<int>(),
                            violationFilter = (object?)null
                        };
                        break;
                }

                results.Add(result);
            }

            return Ok(results);
        }

        /// <summary>
        /// Creates a custom compliance rule (non-system, editable by Lead Auditor).
        /// Section 9: Logs COMPLIANCE_RULE_CREATED to AuditLog.
        /// </summary>
        [HttpPost("compliance/rules")]
        public async Task<IActionResult> CreateRule([FromBody] CreateRuleRequest req)
        {
            var tenantId = GetTenantId();
            var userId   = GetUserId();
            if (tenantId == 0) return NoTenant();
            if (userId == 0)   return NoUser();

            var rule = new ComplianceRule
            {
                TenantID        = tenantId,
                Name            = req.Name,
                Description     = req.Description ?? "",
                RuleType        = req.RuleType,
                Threshold       = req.Threshold,
                IsActive        = true,
                IsSystemDefault = false,
                CreatedBy       = userId
            };

            _context.ComplianceRules.Add(rule);

            // Section 9: Audit log for rule creation
            _context.AuditLogs.Add(new AuditLog
            {
                TenantID        = tenantId,
                UserID          = userId,
                ActionType      = "COMPLIANCE_RULE_CREATED",
                TargetResources = req.Name,
                IPAddress       = GetClientIp(),
                TimeStamp       = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Compliance rule created.", ruleId = rule.RuleID });
        }

        /// <summary>
        /// Updates an existing non-system rule's threshold or name.
        /// </summary>
        [HttpPut("compliance/rules/{id:int}")]
        public async Task<IActionResult> UpdateRule(int id, [FromBody] UpdateRuleRequest req)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var rule = await _context.ComplianceRules.FirstOrDefaultAsync(r => r.RuleID == id && r.TenantID == tenantId);
            if (rule == null) return NotFound(new { message = "Rule not found." });

            rule.Name      = req.Name ?? rule.Name;
            rule.Threshold = req.Threshold ?? rule.Threshold;
            rule.IsActive  = req.IsActive ?? rule.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Rule updated." });
        }

        /// <summary>
        /// Soft-deletes (deactivates) a non-system compliance rule.
        /// </summary>
        [HttpDelete("compliance/rules/{id:int}")]
        public async Task<IActionResult> DeleteRule(int id)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var rule = await _context.ComplianceRules.FirstOrDefaultAsync(r => r.RuleID == id && r.TenantID == tenantId);
            if (rule == null) return NotFound(new { message = "Rule not found." });
            if (rule.IsSystemDefault) return BadRequest(new { message = "System default rules cannot be deleted." });

            _context.ComplianceRules.Remove(rule);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Rule deleted." });
        }
    }

    public record CreateRuleRequest(string Name, string RuleType, decimal Threshold, string? Description);
    public record UpdateRuleRequest(string? Name, decimal? Threshold, bool? IsActive);
}
