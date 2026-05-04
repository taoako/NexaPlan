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
    }
}
