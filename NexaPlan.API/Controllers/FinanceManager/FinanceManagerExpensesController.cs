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
        public FinanceManagerExpensesController(AppDbContext context) : base(context) { }

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
        public async Task<IActionResult> ReconcileExpense(int id)
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
            expense.Status = "Reconciled";
            expense.ReconciledBy = userId;
            expense.ReconciledAt = DateTime.UtcNow;

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
            return Ok(new { message = "Expense reconciled. ActualSpent updated for department." });
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
}
