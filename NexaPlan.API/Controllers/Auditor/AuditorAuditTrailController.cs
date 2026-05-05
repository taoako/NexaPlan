using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.Auditor
{
    [Route("api/auditor")]
    [ApiController]
    public class AuditorAuditTrailController : AuditorBaseController
    {
        public AuditorAuditTrailController(AppDbContext context) : base(context) { }

        /// <summary>
        /// Returns all audit log entries for the tenant, with optional filters.
        /// Supports search, action type, flagged-only filters.
        /// </summary>
        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs(
            [FromQuery] string? search,
            [FromQuery] string? actionType,
            [FromQuery] bool? flaggedOnly,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var query = _context.AuditLogs
                .Include(l => l.Actor)
                .Where(l => l.TenantID == tenantId);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(l =>
                    l.ActionType.Contains(search) ||
                    l.TargetResources.Contains(search) ||
                    l.IPAddress.Contains(search));

            if (!string.IsNullOrWhiteSpace(actionType) && actionType != "All")
                query = query.Where(l => l.ActionType == actionType);

            if (flaggedOnly == true)
                query = query.Where(l => l.IsFlagged);

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(l => l.TimeStamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    id         = l.LogID,
                    timestamp  = l.TimeStamp.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                    actor      = l.Actor != null ? l.Actor.Name : $"UserID:{l.UserID}",
                    role       = l.Actor != null && l.Actor.Role != null ? l.Actor.Role.RoleName : "Unknown",
                    action     = l.ActionType,
                    target     = l.TargetResources,
                    ip         = l.IPAddress,
                    isFlagged  = l.IsFlagged,
                    flagReason = l.FlagReason,
                    flaggedAt  = l.FlaggedAt.HasValue ? l.FlaggedAt.Value.ToString("MMM dd, yyyy HH:mm") : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, logs });
        }

        /// <summary>
        /// Returns a summary count of actions grouped by type — for the overview dashboard.
        /// </summary>
        [HttpGet("logs/summary")]
        public async Task<IActionResult> GetLogSummary()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var total      = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId);
            var flagged    = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId && l.IsFlagged);
            var today      = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId && l.TimeStamp.Date == DateTime.UtcNow.Date);
            var transfers  = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId && l.ActionType == "FUNDS_TRANSFERRED");
            var approvals  = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId && l.ActionType == "BUDGET_APPROVED");

            var recentLogs = await _context.AuditLogs
                .Include(l => l.Actor)
                .Where(l => l.TenantID == tenantId)
                .OrderByDescending(l => l.TimeStamp)
                .Take(5)
                .Select(l => new
                {
                    id        = l.LogID,
                    action    = l.ActionType,
                    actor     = l.Actor != null ? l.Actor.Name : $"UserID:{l.UserID}",
                    target    = l.TargetResources,
                    timestamp = l.TimeStamp.ToString("MMM dd HH:mm"),
                    isFlagged = l.IsFlagged
                })
                .ToListAsync();

            return Ok(new { total, flagged, today, transfers, approvals, recentLogs });
        }

        /// <summary>
        /// Flag a specific audit log entry for investigation.
        /// </summary>
        [HttpPost("logs/{id:int}/flag")]
        public async Task<IActionResult> FlagLog(int id, [FromBody] FlagRequest req)
        {
            var tenantId = GetTenantId();
            var userId   = GetUserId();
            if (tenantId == 0) return NoTenant();
            if (userId == 0)   return NoUser();

            var log = await _context.AuditLogs.FirstOrDefaultAsync(l => l.LogID == id && l.TenantID == tenantId);
            if (log == null) return NotFound(new { message = "Log entry not found." });

            log.IsFlagged  = true;
            log.FlagReason = req.Reason;
            log.FlaggedBy  = userId;
            log.FlaggedAt  = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Log entry flagged for investigation." });
        }

        /// <summary>
        /// Unflag a previously flagged audit log.
        /// </summary>
        [HttpPost("logs/{id:int}/unflag")]
        public async Task<IActionResult> UnflagLog(int id)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var log = await _context.AuditLogs.FirstOrDefaultAsync(l => l.LogID == id && l.TenantID == tenantId);
            if (log == null) return NotFound(new { message = "Log entry not found." });

            log.IsFlagged  = false;
            log.FlagReason = null;
            log.FlaggedBy  = null;
            log.FlaggedAt  = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Flag removed." });
        }
    }

    public record FlagRequest(string Reason);
}
