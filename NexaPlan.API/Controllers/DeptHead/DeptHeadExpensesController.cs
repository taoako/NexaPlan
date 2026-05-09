using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.DeptHead
{
    [Route("api/dept-head")]
    [ApiController]
    public class DeptHeadExpensesController : DeptHeadBaseController
    {
        public DeptHeadExpensesController(AppDbContext context) : base(context) { }

        [HttpGet("expenses")]
        public async Task<IActionResult> GetExpenses()
        {
            var tenantId = GetTenantId();
            var deptId = await GetDepartmentIdAsync();
            if (tenantId == 0 || deptId == 0) return BadRequest("Invalid session.");

            var expenses = await _context.Expenses
                .Include(e => e.Proposal)
                .Where(e => e.TenantID == tenantId && e.DepartmentID == deptId)
                .OrderByDescending(e => e.SubmittedAt)
                .Select(e => new
                {
                    id = e.ExpenseID,
                    proposalId = e.ProposalID,
                    proposalTitle = e.Proposal != null ? e.Proposal.Title : "Unknown",
                    amount = e.Amount,
                    taxPaid = e.TaxPaid,
                    receiptUrl = e.ReceiptUrl,
                    status = e.Status == "Pending_Reconciliation" ? "Pending" : e.Status,
                    submittedDate = e.SubmittedAt.ToString("MMM dd, yyyy"),
                    reconciledDate = e.ReconciledAt.HasValue ? e.ReconciledAt.Value.ToString("MMM dd, yyyy") : null
                })
                .ToListAsync();

            return Ok(expenses);
        }

        [HttpGet("proposals/approved")]
        public async Task<IActionResult> GetApprovedProposals()
        {
            var tenantId = GetTenantId();
            var deptId = await GetDepartmentIdAsync();
            if (tenantId == 0 || deptId == 0) return BadRequest("Invalid session.");

            var proposals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.DepartmentID == deptId && p.ProposalStatus == "Approved")
                .Select(p => new { id = p.ProposalID, title = p.Title, amount = p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount })
                .ToListAsync();

            return Ok(proposals);
        }

        [HttpPost("expenses")]
        public async Task<IActionResult> SubmitExpense([FromBody] SubmitExpenseRequest req)
        {
            var tenantId = GetTenantId();
            var deptId = await GetDepartmentIdAsync();
            var userId = GetUserId();
            if (tenantId == 0 || deptId == 0 || userId == 0) return BadRequest("Invalid session.");

            var proposal = await _context.BudgetProposals.FirstOrDefaultAsync(p => p.ProposalID == req.ProposalId && p.TenantID == tenantId && p.DepartmentID == deptId);
            if (proposal == null || proposal.ProposalStatus != "Approved")
                return BadRequest(new { message = "Invalid or unapproved proposal." });

            var expense = new Expense
            {
                TenantID = tenantId,
                DepartmentID = deptId,
                ProposalID = req.ProposalId,
                Amount = req.Amount,
                TaxPaid = req.TaxPaid ?? 0,
                ReceiptUrl = req.ReceiptUrl ?? "receipt_mock.pdf",
                Status = "Pending_Reconciliation",
                SubmittedBy = userId,
                SubmittedAt = DateTime.UtcNow
            };

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Expense submitted successfully for reconciliation." });
        }
    }

    public record SubmitExpenseRequest(int ProposalId, decimal Amount, decimal? TaxPaid, string? ReceiptUrl);
}
