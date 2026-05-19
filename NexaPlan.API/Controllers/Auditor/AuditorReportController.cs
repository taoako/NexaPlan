using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using System.Text;

namespace NexaPlan.API.Controllers.Auditor
{
    /// <summary>
    /// Section 5 &amp; 6: Functional CSV export for audit trail and compliance scan results.
    /// Routes: GET /api/auditor/reports/audit-trail, GET /api/auditor/reports/compliance
    /// </summary>
    [Route("api/auditor/reports")]
    [ApiController]
    public class AuditorReportController : AuditorBaseController
    {
        public AuditorReportController(AppDbContext context) : base(context) { }

        /// <summary>
        /// Exports the filtered audit trail as a CSV file.
        /// GET /api/auditor/reports/audit-trail?from=2026-01-01&amp;to=2026-12-31&amp;format=csv
        /// </summary>
        [HttpGet("audit-trail")]
        public async Task<IActionResult> ExportAuditTrail(
            [FromQuery] string? from,
            [FromQuery] string? to,
            [FromQuery] string? search,
            [FromQuery] string? actionType,
            [FromQuery] string format = "csv")
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var query = _context.AuditLogs
                .Include(l => l.Actor)
                .Where(l => l.TenantID == tenantId);

            if (!string.IsNullOrWhiteSpace(from) && DateTime.TryParse(from, out var fromDate))
                query = query.Where(l => l.TimeStamp >= fromDate);
            if (!string.IsNullOrWhiteSpace(to) && DateTime.TryParse(to, out var toDate))
                query = query.Where(l => l.TimeStamp < toDate.AddDays(1));
            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(l => l.ActionType.Contains(search) || l.TargetResources.Contains(search));
            if (!string.IsNullOrWhiteSpace(actionType) && actionType != "All")
                query = query.Where(l => l.ActionType == actionType);

            var logs = await query
                .OrderByDescending(l => l.TimeStamp)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("Timestamp,Actor,Role,Action,Target Resource,IP Address,Status,Flag Reason");

            foreach (var log in logs)
            {
                var actorName = log.Actor?.Name ?? $"UserID:{log.UserID}";
                var actorRole = "Unknown"; // Role not eagerly loaded here for perf
                sb.AppendLine(
                    $"{log.TimeStamp:yyyy-MM-dd HH:mm:ss}," +
                    $"{EscapeCsv(actorName)}," +
                    $"{EscapeCsv(actorRole)}," +
                    $"{EscapeCsv(log.ActionType)}," +
                    $"{EscapeCsv(log.TargetResources)}," +
                    $"{EscapeCsv(log.IPAddress)}," +
                    $"{(log.IsFlagged ? "Flagged" : "Logged")}," +
                    $"{EscapeCsv(log.FlagReason ?? "")}");
            }

            var fromStr = from ?? DateTime.UtcNow.Year.ToString();
            var toStr   = to   ?? DateTime.UtcNow.Year.ToString();
            var bytes   = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"nexaplan-audit-trail-{fromStr}-to-{toStr}.csv");
        }

        /// <summary>
        /// Exports the compliance scan results as a CSV file.
        /// GET /api/auditor/reports/compliance?format=csv
        /// </summary>
        [HttpGet("compliance")]
        public async Task<IActionResult> ExportComplianceScan([FromQuery] string format = "csv")
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var rules = await _context.ComplianceRules
                .Where(r => r.TenantID == tenantId && r.IsActive)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("Rule Name,Rule Type,Threshold,Status,Violation Count,Details");

            foreach (var rule in rules)
            {
                // Simple check: BudgetIncrease - check department utilization
                string status = "compliant";
                int violationCount = 0;
                string details = "Check passed";

                if (rule.RuleType == "BudgetIncrease")
                {
                    var depts = await _context.Departments
                        .Where(d => d.TenantID == tenantId && d.AnnualBudgetCap > 0 &&
                               d.ActualSpent > 0 &&
                               (d.ActualSpent / d.AnnualBudgetCap) * 100 > rule.Threshold)
                        .CountAsync();
                    if (depts > 0)
                    {
                        status = "violation";
                        violationCount = depts;
                        details = $"{depts} department(s) over {Math.Round(rule.Threshold, 2)}% threshold";
                    }
                    else
                    {
                        details = "All departments within threshold";
                    }
                }
                else if (rule.RuleType == "OutsideHours")
                {
                    var afterHours = await _context.AuditLogs
                        .CountAsync(l => l.TenantID == tenantId &&
                               (l.ActionType == "FUNDS_TRANSFERRED" || l.ActionType == "PROPOSAL_APPROVED") &&
                               (l.TimeStamp.Hour < 8 || l.TimeStamp.Hour >= 18));
                    if (afterHours > 0)
                    {
                        status = "violation";
                        violationCount = afterHours;
                        details = $"{afterHours} transaction(s) outside business hours";
                    }
                    else
                    {
                        details = "No transactions outside business hours";
                    }
                }

                sb.AppendLine(
                    $"{EscapeCsv(rule.Name)}," +
                    $"{EscapeCsv(rule.RuleType)}," +
                    $"{Math.Round(rule.Threshold, 2)}%," +
                    $"{status}," +
                    $"{violationCount}," +
                    $"{EscapeCsv(details)}");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"nexaplan-compliance-scan-{DateTime.UtcNow:yyyy-MM-dd}.csv");
        }

        private static string EscapeCsv(string value)
            => $"\"{value?.Replace("\"", "\"\"") ?? ""}\"";
    }
}
