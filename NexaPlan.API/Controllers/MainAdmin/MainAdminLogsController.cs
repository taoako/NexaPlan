using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.MainAdmin
{
    [Route("api/main-admin")]
    [ApiController]
    public class MainAdminLogsController : MainAdminBaseController
    {
        public MainAdminLogsController(AppDbContext context) : base(context) { }

        private static string GetLogType(string action) => action switch {
            var a when a.Contains("DELETE") || a.Contains("SUSPEND") => "warning",
            var a when a.Contains("CREATE") || a.Contains("INVITE") || a.Contains("ACTIVATED") => "success",
            _ => "info"
        };

        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs(
            [FromQuery] string? search,
            [FromQuery] string? type,
            [FromQuery] string? from,
            [FromQuery] string? to)
        {
            int tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var query = _context.AuditLogs.Where(l => l.TenantID == tenantId).AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(l => l.ActionType.Contains(search) || l.TargetResources.Contains(search));

            if (!string.IsNullOrWhiteSpace(type) && type != "All")
                query = query.Where(l => l.ActionType.StartsWith(type));

            if (!string.IsNullOrWhiteSpace(from) && DateTime.TryParse(from, out var fromDate))
                query = query.Where(l => l.TimeStamp >= fromDate);

            if (!string.IsNullOrWhiteSpace(to) && DateTime.TryParse(to, out var toDate))
                query = query.Where(l => l.TimeStamp <= toDate.AddDays(1));

            var logs = await query.OrderByDescending(l => l.TimeStamp).Take(200).ToListAsync();
            var userIds = logs.Select(l => l.UserID).Distinct().ToList();
            var users = await _context.Users.Where(u => userIds.Contains(u.UserID)).ToDictionaryAsync(u => u.UserID, u => u.Name);

            return Ok(logs.Select(l => new {
                logId = l.LogID,
                action = l.ActionType,
                target = l.TargetResources,
                userName = users.ContainsKey(l.UserID) ? users[l.UserID] : "System",
                ip = l.IPAddress,
                time = l.TimeStamp,
                type = GetLogType(l.ActionType)
            }));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv(
            [FromQuery] string? search    = null,
            [FromQuery] string? type      = null,
            [FromQuery] string? dateFrom  = null,
            [FromQuery] string? dateTo    = null)
        {
            var tenantId = GetTenantId();

            var query = _context.AuditLogs
                .Where(l => l.TenantID == tenantId);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(l => l.ActionType.Contains(search)
                                      || l.TargetResources.Contains(search));
            if (!string.IsNullOrEmpty(type) && type != "All")
                query = query.Where(l => l.ActionType.StartsWith(type));
            if (DateTime.TryParse(dateFrom, out var from))
                query = query.Where(l => l.TimeStamp >= from);
            if (DateTime.TryParse(dateTo, out var to))
                query = query.Where(l => l.TimeStamp <= to.AddDays(1));

            var logs = await query
                .OrderByDescending(l => l.TimeStamp)
                .Include(l => l.Actor)
                .ToListAsync();

            // Resolve department from TargetResources field (best-effort parsing)
            static string ParseDept(string details) {
                var match = System.Text.RegularExpressions.Regex
                    .Match(details, @"Dept:(\w+)");
                return match.Success ? match.Groups[1].Value : "";
            }

            static string ParseEntityType(string action) => action switch {
                var a when a.Contains("Alloc")     => "Department",
                var a when a.Contains("User")      => "User",
                var a when a.Contains("Proposal")  => "Budget Proposal",
                var a when a.Contains("Scenario")  => "Scenario",
                var a when a.Contains("Expense")   => "Expense",
                var a when a.Contains("Statement") => "Financial Statement",
                var a when a.Contains("Login")     => "Auth Session",
                _ => "System"
            };

            static string ParseCategory(string action) => action switch {
                var a when a.Contains("Alloc") || a.Contains("Proposal")
                        || a.Contains("Expense") || a.Contains("Scenario") => "Budget",
                var a when a.Contains("User") || a.Contains("Login")
                        || a.Contains("Lock") || a.Contains("Password") => "User Management",
                var a when a.Contains("Statement") || a.Contains("Compliance") => "Compliance",
                var a when a.Contains("Billing") || a.Contains("Invoice") => "Billing",
                var a when a.Contains("Settings") => "Configuration",
                _ => "General"
            };

            static string ParseActionCode(string action) => action switch {
                "AllocationSet"            => "ALLOC_SET",
                "AllocationAdjusted"       => "ALLOC_ADJUST",
                "ProposalSubmitted"        => "PROP_SUBMIT",
                "ProposalApproved"         => "PROP_APPROVE",
                "ProposalRejected"         => "PROP_REJECT",
                "ScenarioActivated"        => "SCEN_ACTIVATE",
                "ScenarioDeactivated"      => "SCEN_DEACTIVATE",
                "ScenarioPitchSubmitted"   => "SCEN_PITCH_SUBMIT",
                "ScenarioPitchAcknowledged"=> "SCEN_PITCH_ACK",
                "UserInvited"              => "USER_INVITE",
                "UserUpdated"              => "USER_UPDATE",
                "UserLocked"               => "USER_LOCK",
                "UserUnlocked"             => "USER_UNLOCK",
                "StatementDownloaded"      => "STMT_DOWNLOAD",
                "ExpenseReconciled"        => "EXP_RECONCILE",
                "ExpenseRejected"          => "EXP_REJECT",
                "LoginSuccess"             => "AUTH_LOGIN_OK",
                "LoginFailed"              => "AUTH_LOGIN_FAIL",
                "SettingsUpdated"          => "CFG_SETTINGS",
                _ => action.ToUpper().Replace(" ", "_")
            };

            var sb = new System.Text.StringBuilder();

            // Header row
            sb.AppendLine(string.Join(",", new[] {
                "Event ID",
                "Timestamp (UTC ISO 8601)",
                "Date",
                "Time (24h)",
                "Day of Week",
                "Action Code",
                "Action Category",
                "Action Description",
                "Entity Type",
                "Department",
                "User ID",
                "User Full Name",
                "User Role",
                "IP Address",
                "Details / Notes",
                "Fiscal Year",
                "Status"
            }));

            int eventId = logs.Count;
            foreach (var log in logs)
            {
                var ts       = log.TimeStamp.ToUniversalTime();
                var roleName = log.Actor?.RoleID switch {
                    1 => "Super Admin", 2 => "Main Admin", 3 => "Finance Manager",
                    4 => "Department Head", 5 => "Auditor", 6 => "Viewer",
                    _ => "Unknown"
                };
                var fullName = log.Actor != null
                    ? $"{log.Actor.FirstName} {log.Actor.LastName}".Trim()
                    : "System";

                string Esc(string? s) =>
                    s == null ? "" : $"\"{s.Replace("\"", "\"\"")}\"";

                sb.AppendLine(string.Join(",", new[] {
                    eventId--.ToString(),
                    ts.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    ts.ToString("yyyy-MM-dd"),
                    ts.ToString("HH:mm:ss"),
                    ts.DayOfWeek.ToString(),
                    ParseActionCode(log.ActionType),
                    ParseCategory(log.ActionType),
                    Esc(log.ActionType),
                    ParseEntityType(log.ActionType),
                    Esc(ParseDept(log.TargetResources ?? "")),
                    log.UserID.ToString(),
                    Esc(fullName),
                    Esc(roleName),
                    Esc(log.IPAddress ?? ""),
                    Esc(log.TargetResources ?? ""),
                    ts.Year.ToString(),
                    "Success"
                }));
            }

            var fileName = $"NexaPlan_AuditLog_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv";
            var bytes    = System.Text.Encoding.UTF8.GetPreamble()
                           .Concat(System.Text.Encoding.UTF8.GetBytes(sb.ToString()))
                           .ToArray();

            return File(bytes, "text/csv; charset=utf-8", fileName);
        }
    }
}
