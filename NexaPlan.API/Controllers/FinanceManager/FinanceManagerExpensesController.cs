using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.FinanceManager
{
    [Route("api/finance-manager")]
    [ApiController]
    public class FinanceManagerExpensesController : FinanceManagerBaseController
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private const string ML_SERVICE_URL = "http://localhost:8001";

        private static readonly string[] MonthOrder =
            { "JAN","FEB","MAR","APR","MAY","JUN",
              "JUL","AUG","SEP","OCT","NOV","DEC" };

        public FinanceManagerExpensesController(AppDbContext context, IHttpClientFactory httpClientFactory) : base(context)
        {
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>
        /// Finance Manager reviews all pending expense submissions across all departments.
        /// </summary>
        [HttpGet("expenses")]
        public async Task<IActionResult> GetAllExpenses([FromQuery] string? status)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var query = _context.Expenses
                .Include(e => e.Department)
                .Include(e => e.Proposal)
                .Include(e => e.Submitter)
                .Where(e => e.TenantID == tenantId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (status == "Pending")
                    query = query.Where(e => e.Status == "Pending" || e.Status == "Pending_Reconciliation");
                else
                    query = query.Where(e => e.Status == status);
            }

            var expenses = await query
                .OrderByDescending(e => e.SubmittedAt)
                .Select(e => new
                {
                    id = e.ExpenseID,
                    department = e.Department != null ? e.Department.DepartmentName : "Unknown",
                    proposalId = e.ProposalID,
                    proposalTitle = e.Proposal != null ? e.Proposal.Title : "Unknown",
                    proposalBudget = e.Proposal != null ? (e.Proposal.RequestedAmount > 0 ? e.Proposal.RequestedAmount : e.Proposal.TotalAmount) : 0,
                    actualAmount = e.Amount,
                    variance = (e.Proposal != null ? (e.Proposal.RequestedAmount > 0 ? e.Proposal.RequestedAmount : e.Proposal.TotalAmount) : 0) - e.Amount,
                    receiptUrl = e.ReceiptUrl,
                    taxPaid = e.TaxPaid,
                    status = e.Status == "Pending_Reconciliation" ? "Pending" : e.Status,
                    submittedBy = e.Submitter != null ? e.Submitter.Name : "Unknown",
                    submittedDate = e.SubmittedAt.ToString("MMM dd, yyyy"),
                    reconciledDate = e.ReconciledAt.HasValue ? e.ReconciledAt.Value.ToString("MMM dd, yyyy") : null
                })
                .ToListAsync();

            return Ok(expenses);
        }

        /// <summary>
        /// Finance Manager reconciles (clears) an expense. This updates Department.ActualSpent.
        /// </summary>
        [HttpPost("expenses/{id:int}/reconcile")]
        public async Task<IActionResult> ReconcileExpense(int id, [FromBody] ReconcileExpenseRequest? req)
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();
            if (userId == 0) return NoUser();

            var expense = await _context.Expenses
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.ExpenseID == id && e.TenantID == tenantId);

            if (expense == null) return NotFound(new { message = "Expense not found." });
            if (expense.Status != "Pending" && expense.Status != "Pending_Reconciliation")
                return BadRequest(new { message = "Only pending expenses can be reconciled." });

            // Mark the expense as reconciled
            expense.Status      = "Reconciled";
            expense.ReconciledBy = userId;
            expense.ReconciledAt = DateTime.UtcNow;

            // SpentDate = the date on the physical receipt (not the reconciliation click date)
            expense.ExpenseDate = req?.SpentDate?.ToUniversalTime() ?? expense.SubmittedAt;

            // Update the department's ActualSpent accumulator
            if (expense.Department != null)
            {
                expense.Department.ActualSpent += expense.Amount;
            }

            // Audit log
            _context.AuditLogs.Add(new AuditLog
            {
                TenantID = tenantId,
                UserID = userId,
                ActionType = "EXPENSE_RECONCILED",
                TargetResources = $"ExpenseID:{id} Amount:₱{expense.Amount}",
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            // ── ML Anomaly Detection (non-blocking) ───────────────────────────
            bool   anomalyDetected = false;
            string anomalyMessage  = string.Empty;
            try
            {
                var dept = expense.Department;
                if (dept != null)
                {
                    // Monthly cap: use DepartmentAllocation if present, else AnnualBudgetCap / 12
                    var fiscalYear = DateTime.UtcNow.Year;
                    var allocation = await _context.DepartmentAllocations
                        .FirstOrDefaultAsync(a => a.TenantID == tenantId && a.DepartmentID == dept.DepartmentID && a.FiscalYear == fiscalYear);
                    var annualCap  = allocation?.TotalAllocatedCap ?? dept.AnnualBudgetCap;
                    var monthlyCap = (double)(annualCap / 12m);

                    var currentMonthIdx = DateTime.UtcNow.Month;
                    var currentMonth = MonthOrder[currentMonthIdx - 1];
                    
                    // Monthly actual: sum reconciled expenses for this department in the current month
                    var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                    var monthEnd = monthStart.AddMonths(1).AddDays(-1);
                    
                    var monthlyActualSpent = await _context.Expenses
                        .Where(e => e.DepartmentID == dept.DepartmentID && e.TenantID == tenantId && e.Status == "Reconciled" 
                                 && (e.ExpenseDate ?? e.ReconciledAt ?? e.SubmittedAt) >= monthStart 
                                 && (e.ExpenseDate ?? e.ReconciledAt ?? e.SubmittedAt) <= monthEnd)
                        .SumAsync(e => e.Amount);

                    var payload      = new DTOs.MlPredictRequest(monthlyCap, dept.DepartmentName, currentMonth);
                    var client       = _httpClientFactory.CreateClient();
                    var mlResp       = await client.PostAsJsonAsync($"{ML_SERVICE_URL}/predict", payload);

                    if (mlResp.IsSuccessStatusCode)
                    {
                        var pred = await mlResp.Content.ReadFromJsonAsync<DTOs.MlPredictResponse>();
                        if (pred != null)
                        {
                            var mlExpected  = pred.predicted_spending;
                            var actualSpent = (double)monthlyActualSpent;
                            if (actualSpent > mlExpected * 1.20)
                            {
                                var overPct    = ((actualSpent - mlExpected) / mlExpected) * 100;
                                anomalyDetected = true;
                                anomalyMessage  = $"{dept.DepartmentName}'s monthly spend is {overPct:F0}% above ML expectation for {currentMonth}. Review recommended.";
                            }
                        }
                    }
                }
            }
            catch { /* Non-blocking — never fail the reconcile itself */ }

            return Ok(new { message = "Expense reconciled. ActualSpent updated for department.", anomalyDetected, anomalyMessage });
        }

        /// <summary>
        /// Finance Manager rejects an expense (e.g., invalid receipt).
        /// </summary>
        [HttpPost("expenses/{id:int}/reject")]
        public async Task<IActionResult> RejectExpense(int id, [FromBody] RejectExpenseRequest req)
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();
            if (userId == 0) return NoUser();

            var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.ExpenseID == id && e.TenantID == tenantId);
            if (expense == null) return NotFound(new { message = "Expense not found." });
            if (expense.Status != "Pending" && expense.Status != "Pending_Reconciliation")
                return BadRequest(new { message = "Only pending expenses can be rejected." });

            expense.Status = "Rejected";
            expense.ReconciledBy = userId;
            expense.ReconciledAt = DateTime.UtcNow;

            _context.AuditLogs.Add(new AuditLog
            {
                TenantID = tenantId,
                UserID = userId,
                ActionType = "EXPENSE_REJECTED",
                TargetResources = $"ExpenseID:{id} Reason:{req.Reason}",
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Expense rejected." });
        }
    }

    public record RejectExpenseRequest(string Reason);
    public record ReconcileExpenseRequest(DateTime? SpentDate);
}
