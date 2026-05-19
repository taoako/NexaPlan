using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using NexaPlan.API.Documents;
using System.Security.Cryptography;
using QuestPDF.Fluent;

namespace NexaPlan.API.Controllers.FinanceManager
{
    [Route("api/finance-manager/statements")]
    [ApiController]
    public class FinanceManagerStatementsController : FinanceManagerBaseController
    {
        private readonly IWebHostEnvironment _env;

        public FinanceManagerStatementsController(AppDbContext context, IWebHostEnvironment env) : base(context)
        {
            _env = env;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GenerateStatement([FromBody] GenerateStatementRequest request)
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();

            // 1. Resolve date range
            var (fromDate, toDate, periodLabel) = ResolvePeriod(request.FiscalYear, request.Quarter);

            // 2. Assemble all data
            var tenant = await _context.Tenants.FindAsync(tenantId);
            if (tenant == null) return NotFound("Tenant not found.");
            var generator = await _context.Users.FindAsync(userId);
            if (generator == null) return NotFound("User not found.");

            var departments = await _context.Departments
                .Where(d => d.TenantID == tenantId)
                .ToListAsync();

            var allocations = await _context.DepartmentAllocations
                .Where(a => a.TenantID == tenantId && a.FiscalYear == request.FiscalYear)
                .ToListAsync();

            var proposals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId
                    && p.ProposalStatus == "Approved"
                    && p.PlannedYear == request.FiscalYear)
                .ToListAsync();

            var expenses = await _context.Expenses
                .Where(e => e.TenantID == tenantId
                    && e.Status == "Reconciled"
                    && e.ExpenseDate >= fromDate
                    && e.ExpenseDate < toDate)
                .ToListAsync();

            var pendingProposals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId
                    && (p.ProposalStatus == "Pending" || p.ProposalStatus == "UnderReview")
                    && p.PlannedYear == request.FiscalYear)
                .ToListAsync();

            var recentLogs = await _context.AuditLogs
                .Include(l => l.Actor)
                .Where(l => l.TenantID == tenantId
                    && l.TimeStamp >= fromDate
                    && l.TimeStamp < toDate)
                .OrderByDescending(l => l.TimeStamp)
                .Take(10)
                .ToListAsync();

            // 9. Compute summary figures
            decimal totalAllocated = allocations.Any()
                ? allocations.Sum(a => a.TotalAllocatedCap)
                : departments.Sum(d => d.AnnualBudgetCap);

            decimal totalCommitted = proposals.Sum(p => p.RequestedAmount);
            decimal totalActual = expenses.Sum(e => e.Amount);
            decimal totalTax = expenses.Sum(e => e.TaxPaid);
            decimal totalVariance = totalAllocated - totalActual;
            decimal utilizationPct = totalAllocated > 0
                ? Math.Round((totalActual / totalAllocated) * 100, 1)
                : 0;
            decimal pendingRisk = pendingProposals.Sum(p => p.RequestedAmount);

            // 10. Per-department breakdown
            var deptRows = departments.Select(d => {
                var alloc = allocations.FirstOrDefault(a => a.DepartmentID == d.DepartmentID);
                var cap = alloc?.TotalAllocatedCap ?? d.AnnualBudgetCap;
                var committed = proposals
                    .Where(p => p.DepartmentID == d.DepartmentID)
                    .Sum(p => p.RequestedAmount);
                var actual = expenses
                    .Where(e => e.DepartmentID == d.DepartmentID)
                    .Sum(e => e.Amount);
                var tax = expenses
                    .Where(e => e.DepartmentID == d.DepartmentID)
                    .Sum(e => e.TaxPaid);
                var variance = cap - actual;
                var utilPct = cap > 0 ? Math.Round((actual / cap) * 100, 1) : 0;
                return new DeptRow {
                    DepartmentId = d.DepartmentID,
                    Name = d.DepartmentName,
                    AllocatedCap = cap,
                    Committed = committed,
                    ActualSpent = actual,
                    TaxPaid = tax,
                    Variance = variance,
                    UtilizationPct = utilPct,
                    Status = utilPct >= 90 ? "At Risk" : utilPct >= 75 ? "Monitor" : "On Track"
                };
            }).ToList();

            // 3. Build StatementData object
            var data = new StatementData
            {
                Title = request.Title,
                StatementType = request.StatementType,
                PeriodLabel = periodLabel,
                FiscalYear = request.FiscalYear,
                GeneratedAt = DateTime.UtcNow,
                GeneratorName = $"{generator.FirstName} {generator.LastName}",
                CompanyName = tenant.CompanyName ?? "NexaPlan Client",
                CompanyEmail = tenant.ContactEmail ?? "",
                CompanyPhone = tenant.Phone ?? "",
                SubscriptionTier = tenant.SubscriptionTier ?? "Professional",
                Sha256Hash = "Computing...",  // placeholder — replaced after generation

                TotalAllocated = totalAllocated,
                TotalCommitted = totalCommitted,
                TotalActual = totalActual,
                TotalTax = totalTax,
                TotalVariance = totalVariance,
                UtilizationPct = utilizationPct,
                PendingRisk = pendingRisk,
                DeptRows = deptRows,
                PendingProposals = pendingProposals,
                RecentLogs = recentLogs,
            };

            // 4. Generate PDF bytes (first pass — no hash yet)
            var document = new FinancialStatementDocument(data);
            var pdfBytes = document.GeneratePdf();

            // 5. Compute SHA-256 of the PDF bytes
            var hashBytes = SHA256.HashData(pdfBytes);
            var hash = Convert.ToHexString(hashBytes).ToLower();

            // 6. Re-generate PDF with the real hash embedded
            data.Sha256Hash = hash;
            var finalPdfBytes = new FinancialStatementDocument(data).GeneratePdf();

            // 7. Save to disk
            var folder = Path.Combine(_env.WebRootPath ?? "wwwroot", "statements", $"tenant-{tenantId}");
            Directory.CreateDirectory(folder);
            var fileName = $"{Guid.NewGuid()}.pdf";
            var fullPath = Path.Combine(folder, fileName);
            await System.IO.File.WriteAllBytesAsync(fullPath, finalPdfBytes);

            // 8. Compute final hash of the file-as-saved
            var finalHashBytes = SHA256.HashData(finalPdfBytes);
            var finalHash = Convert.ToHexString(finalHashBytes).ToLower();

            // 9. File size string
            var sizeKb = finalPdfBytes.Length / 1024.0;
            var sizeStr = sizeKb >= 1024 ? $"{sizeKb / 1024:F1} MB" : $"{sizeKb:F0} KB";

            // 10. Save FinancialStatement record to DB
            var statement = new FinancialStatement
            {
                TenantID = tenantId,
                Name = request.Title,
                FileType = request.StatementType,
                FilePath = $"/statements/tenant-{tenantId}/{fileName}",
                FileSize = sizeStr,
                Sha256Hash = finalHash,
                TaxAmount = totalTax,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
            };
            _context.FinancialStatements.Add(statement);

            // 11. Audit log
            _context.AuditLogs.Add(new AuditLog
            {
                TenantID = tenantId,
                UserID = userId,
                ActionType = "STATEMENT_GENERATED",
                TargetResources = request.Title,
                IPAddress = GetClientIp(),
                TimeStamp = DateTime.UtcNow,
            });

            await _context.SaveChangesAsync();
            return Ok(MapToDto(statement));
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadStatement(int id)
        {
            var tenantId = GetTenantId();
            var statement = await _context.FinancialStatements
                .FirstOrDefaultAsync(s => s.StatementID == id && s.TenantID == tenantId);

            if (statement == null) return NotFound();

            var fullPath = Path.Combine(_env.WebRootPath ?? "wwwroot",
                statement.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (!System.IO.File.Exists(fullPath))
                return NotFound(new { message = "File not found on server." });

            var bytes = await System.IO.File.ReadAllBytesAsync(fullPath);

            var user = await _context.Users.FindAsync(GetUserId());

            // Log access
            _context.StatementAccessLogs.Add(new StatementAccessLog
            {
                StatementID = id,
                UserID = GetUserId(),
                AccessType = "Downloaded",
                AccessedAt = DateTime.UtcNow,
                IPAddress = GetClientIp(),
            });
            await _context.SaveChangesAsync();

            var ext = Path.GetExtension(fullPath).ToLower();
            var contentType = ext == ".pdf" ? "application/pdf"
                : ext == ".xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "application/octet-stream";

            return File(bytes, contentType, Path.GetFileName(fullPath));
        }

        // Added this GET endpoint so frontend can show a list of statements
        [HttpGet]
        public async Task<IActionResult> GetStatements()
        {
            var tenantId = GetTenantId();
            var statements = await _context.FinancialStatements
                .Where(s => s.TenantID == tenantId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => MapToDto(s))
                .ToListAsync();

            return Ok(statements);
        }

        private (DateTime from, DateTime to, string label) ResolvePeriod(int year, string? quarter)
        {
            return quarter switch
            {
                "Q1" => (new DateTime(year, 1, 1), new DateTime(year, 4, 1), $"Q1 {year} (Jan – Mar)"),
                "Q2" => (new DateTime(year, 4, 1), new DateTime(year, 7, 1), $"Q2 {year} (Apr – Jun)"),
                "Q3" => (new DateTime(year, 7, 1), new DateTime(year, 10, 1), $"Q3 {year} (Jul – Sep)"),
                "Q4" => (new DateTime(year, 10, 1), new DateTime(year + 1, 1, 1), $"Q4 {year} (Oct – Dec)"),
                _    => (new DateTime(year, 1, 1), new DateTime(year + 1, 1, 1), $"Full Year {year}"),
            };
        }

        private static object MapToDto(FinancialStatement s)
        {
            return new
            {
                id = s.StatementID,
                title = s.Name,
                statementType = s.FileType,
                filePath = s.FilePath,
                fileSize = s.FileSize,
                sha256Hash = s.Sha256Hash,
                taxAmount = s.TaxAmount,
                createdAt = s.CreatedAt,
                createdBy = s.CreatedBy
            };
        }
    }

    public class GenerateStatementRequest
    {
        public string Title { get; set; } = string.Empty;
        public string StatementType { get; set; } = string.Empty;
        public int FiscalYear { get; set; }
        public string? Quarter { get; set; }
    }
}
