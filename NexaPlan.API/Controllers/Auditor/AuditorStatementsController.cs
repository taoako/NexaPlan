using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using System.Security.Cryptography;
using System.Text;

namespace NexaPlan.API.Controllers.Auditor
{
    [Route("api/auditor")]
    [ApiController]
    public class AuditorStatementsController : AuditorBaseController
    {
        public AuditorStatementsController(AppDbContext context) : base(context) { }

        /// <summary>
        /// Returns all financial statements for the tenant with their SHA-256 hash.
        /// Seeds demo documents if none exist.
        /// </summary>
        [HttpGet("statements")]
        public async Task<IActionResult> GetStatements()
        {
            var tenantId = GetTenantId();
            var userId   = GetUserId();
            if (tenantId == 0) return NoTenant();

            if (!await _context.FinancialStatements.AnyAsync(s => s.TenantID == tenantId))
            {
                var seeds = new List<FinancialStatement>
                {
                    new() { TenantID=tenantId, Name="Q1 2026 Consolidated Budget Statement.pdf",   FileType="Budget Statement",  FileSize="2.4 MB",  Sha256Hash=ComputeHash("Q1 2026 Consolidated Budget Statement"),   CreatedBy=userId, CreatedAt=new DateTime(2026,3,31) },
                    new() { TenantID=tenantId, Name="FY 2025 Variance Analysis Summary.pdf",        FileType="Variance Report",   FileSize="1.8 MB",  Sha256Hash=ComputeHash("FY 2025 Variance Analysis Summary"),        CreatedBy=userId, CreatedAt=new DateTime(2025,12,31) },
                    new() { TenantID=tenantId, Name="Q4 2025 Department Budget Breakdown.xlsx",     FileType="Budget Breakdown",  FileSize="856 KB",  Sha256Hash=ComputeHash("Q4 2025 Department Budget Breakdown"),      CreatedBy=userId, CreatedAt=new DateTime(2025,12,15) },
                    new() { TenantID=tenantId, Name="March 2026 Expense Forecast Report.pdf",       FileType="Forecast Report",   FileSize="1.2 MB",  Sha256Hash=ComputeHash("March 2026 Expense Forecast Report"),       CreatedBy=userId, CreatedAt=new DateTime(2026,3,25) },
                };
                _context.FinancialStatements.AddRange(seeds);
                await _context.SaveChangesAsync();
            }

            var statements = await _context.FinancialStatements
                .Where(s => s.TenantID == tenantId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    id         = s.StatementID,
                    name       = s.Name,
                    fileType   = s.FileType,
                    fileSize   = s.FileSize,
                    sha256Hash = s.Sha256Hash,
                    date       = s.CreatedAt.ToString("yyyy-MM-dd"),
                    taxAmount  = s.TaxAmount
                })
                .ToListAsync();

            return Ok(statements);
        }

        /// <summary>
        /// Logs a view/download event for a statement (access tracking).
        /// </summary>
        [HttpPost("statements/{id:int}/access")]
        public async Task<IActionResult> LogAccess(int id, [FromBody] AccessRequest req)
        {
            var tenantId = GetTenantId();
            var userId   = GetUserId();
            if (tenantId == 0) return NoTenant();
            if (userId == 0)   return NoUser();

            var statement = await _context.FinancialStatements.FirstOrDefaultAsync(s => s.StatementID == id && s.TenantID == tenantId);
            if (statement == null) return NotFound(new { message = "Statement not found." });

            var accessLog = new StatementAccessLog
            {
                StatementID = id,
                TenantID    = tenantId,
                UserID      = userId,
                AccessType  = req.AccessType ?? "View",
                IPAddress   = GetClientIp(),
                AccessedAt  = DateTime.UtcNow
            };

            _context.StatementAccessLogs.Add(accessLog);

            // Also write to main audit log for cross-referencing
            _context.AuditLogs.Add(new AuditLog
            {
                TenantID        = tenantId,
                UserID          = userId,
                ActionType      = req.AccessType == "Download" ? "STATEMENT_DOWNLOADED" : "STATEMENT_VIEWED",
                TargetResources = statement.Name,
                IPAddress       = GetClientIp(),
                TimeStamp       = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Access logged: {req.AccessType ?? "View"}" });
        }

        /// <summary>
        /// Returns the access history for a specific financial statement.
        /// </summary>
        [HttpGet("statements/{id:int}/access-log")]
        public async Task<IActionResult> GetAccessLog(int id)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var logs = await _context.StatementAccessLogs
                .Include(l => l.Accessor)
                .Where(l => l.TenantID == tenantId && l.StatementID == id)
                .OrderByDescending(l => l.AccessedAt)
                .Select(l => new
                {
                    accessor   = l.Accessor != null ? l.Accessor.Name : $"UserID:{l.UserID}",
                    accessType = l.AccessType,
                    ip         = l.IPAddress,
                    accessedAt = l.AccessedAt.ToString("MMM dd, yyyy HH:mm UTC")
                })
                .ToListAsync();

            return Ok(logs);
        }

        private static string ComputeHash(string input)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input + "NexaPlan_Salt_2026"));
            return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
        }
    }

    public record AccessRequest(string? AccessType);
}
