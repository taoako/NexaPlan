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
        /// Supports search, action type, flagged-only, date range, and departmentId filters.
        /// </summary>
        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs(
            [FromQuery] string? search,
            [FromQuery] string? actionType,
            [FromQuery] bool? flaggedOnly,
            [FromQuery] string? from,
            [FromQuery] string? to,
            [FromQuery] int? departmentId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var query = _context.AuditLogs
                .Include(l => l.Actor)
                .Where(l => l.TenantID == tenantId);

            // Date range filter (Bug Fix #4)
            if (!string.IsNullOrWhiteSpace(from) && DateTime.TryParse(from, out var fromDate))
                query = query.Where(l => l.TimeStamp >= fromDate);
            if (!string.IsNullOrWhiteSpace(to) && DateTime.TryParse(to, out var toDate))
                query = query.Where(l => l.TimeStamp < toDate.AddDays(1));

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
                    id          = l.LogID,
                    logId       = l.LogID,
                    timestamp   = l.TimeStamp.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                    actor       = l.Actor != null ? l.Actor.Name : $"UserID:{l.UserID}",
                    actorName   = l.Actor != null ? l.Actor.Name : $"UserID:{l.UserID}",
                    role        = l.Actor != null && l.Actor.Role != null ? l.Actor.Role.RoleName : "Unknown",
                    actorRole   = l.Actor != null && l.Actor.Role != null ? l.Actor.Role.RoleName : "Unknown",
                    action      = l.ActionType,
                    target      = l.TargetResources,
                    targetResource = l.TargetResources,
                    ip          = l.IPAddress,
                    ipAddress   = l.IPAddress,
                    isFlagged   = l.IsFlagged,
                    flagReason  = l.FlagReason,
                    flaggedBy   = l.FlaggerUser != null ? l.FlaggerUser.Name : null,
                    flaggedAt   = l.FlaggedAt.HasValue ? l.FlaggedAt.Value.ToString("MMM dd, yyyy HH:mm") : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, logs });
        }

        /// <summary>
        /// Returns all flagged log entries for the tenant, ordered by FlaggedAt DESC.
        /// Feature: Flagged Entries Management (Section 3)
        /// </summary>
        [HttpGet("logs/flagged")]
        public async Task<IActionResult> GetFlaggedLogs(
            [FromQuery] string? from,
            [FromQuery] string? to,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var query = _context.AuditLogs
                .Include(l => l.Actor)
                .Include(l => l.FlaggerUser)
                .Where(l => l.TenantID == tenantId && l.IsFlagged);

            if (!string.IsNullOrWhiteSpace(from) && DateTime.TryParse(from, out var fromDate))
                query = query.Where(l => l.TimeStamp >= fromDate);
            if (!string.IsNullOrWhiteSpace(to) && DateTime.TryParse(to, out var toDate))
                query = query.Where(l => l.TimeStamp < toDate.AddDays(1));

            var total = await query.CountAsync();

            var logs = await query
                .OrderByDescending(l => l.FlaggedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    id          = l.LogID,
                    logId       = l.LogID,
                    timestamp   = l.TimeStamp.ToString("yyyy-MM-dd HH:mm:ss UTC"),
                    actor       = l.Actor != null ? l.Actor.Name : $"UserID:{l.UserID}",
                    actorName   = l.Actor != null ? l.Actor.Name : $"UserID:{l.UserID}",
                    role        = l.Actor != null && l.Actor.Role != null ? l.Actor.Role.RoleName : "Unknown",
                    actorRole   = l.Actor != null && l.Actor.Role != null ? l.Actor.Role.RoleName : "Unknown",
                    action      = l.ActionType,
                    target      = l.TargetResources,
                    targetResource = l.TargetResources,
                    ip          = l.IPAddress,
                    ipAddress   = l.IPAddress,
                    isFlagged   = l.IsFlagged,
                    flagReason  = l.FlagReason,
                    flaggedBy   = l.FlaggerUser != null ? l.FlaggerUser.Name : null,
                    flaggedAt   = l.FlaggedAt.HasValue ? l.FlaggedAt.Value.ToString("MMM dd, yyyy HH:mm") : null
                })
                .ToListAsync();

            return Ok(new { total, page, pageSize, logs });
        }

        /// <summary>
        /// Returns a summary count of actions grouped by type — for the overview dashboard.
        /// Bug Fix: FlaggedCount now returns the real count from DB.
        /// </summary>
        [HttpGet("logs/summary")]
        public async Task<IActionResult> GetLogSummary()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var total     = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId);
            // Bug Fix #3 from Section 3: Real flagged count
            var flagged   = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId && l.IsFlagged);
            var today     = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId && l.TimeStamp.Date == DateTime.UtcNow.Date);
            var transfers = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId && l.ActionType == "FUNDS_TRANSFERRED");
            var approvals = await _context.AuditLogs.CountAsync(l => l.TenantID == tenantId && (l.ActionType == "BUDGET_APPROVED" || l.ActionType == "PROPOSAL_APPROVED"));

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

        /// <summary>
        /// Read-only budget vs actual variance by department for auditors (Section 7).
        /// GET /api/auditor/variance?fiscalYear=2026
        /// </summary>
        [HttpGet("variance")]
        public async Task<IActionResult> GetVariance([FromQuery] int fiscalYear = 0)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();
            if (fiscalYear == 0) fiscalYear = DateTime.UtcNow.Year;

            var departments = await _context.Departments
                .Where(d => d.TenantID == tenantId)
                .ToListAsync();

            var allocations = await _context.DepartmentAllocations
                .Where(a => a.TenantID == tenantId && a.FiscalYear == fiscalYear)
                .ToListAsync();

            var approvedProposals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.ProposalStatus == "Approved" && p.PlannedYear == fiscalYear)
                .ToListAsync();

            var result = departments.Select(d =>
            {
                var allocation = allocations.FirstOrDefault(a => a.DepartmentID == d.DepartmentID);
                var allocatedCap = allocation?.TotalAllocatedCap ?? d.AnnualBudgetCap;
                var committed = approvedProposals
                    .Where(p => p.DepartmentID == d.DepartmentID)
                    .Sum(p => p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount);
                var actualSpent = d.ActualSpent;
                var variance = allocatedCap - actualSpent;
                var utilizationPct = allocatedCap > 0
                    ? Math.Round((double)(actualSpent / allocatedCap) * 100, 2)
                    : 0;

                return new
                {
                    departmentId   = d.DepartmentID,
                    departmentName = d.DepartmentName,
                    allocatedCap,
                    committedFunds = committed,
                    actualSpent,
                    variance,
                    utilizationPct
                };
            }).ToList();

            var totalAllocated   = result.Sum(r => r.allocatedCap);
            var totalActualSpent = result.Sum(r => r.actualSpent);
            var totalVariance    = result.Sum(r => r.variance);

            return Ok(new
            {
                fiscalYear,
                departments = result,
                totalAllocated,
                totalActualSpent,
                totalVariance
            });
        }
    }

    public record FlagRequest(string Reason);
}
