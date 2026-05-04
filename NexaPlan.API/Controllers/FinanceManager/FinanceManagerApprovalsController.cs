using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.FinanceManager
{
    [Route("api/finance-manager")]
    [ApiController]
    public class FinanceManagerApprovalsController : FinanceManagerBaseController
    {
        public FinanceManagerApprovalsController(AppDbContext context) : base(context) { }

        [HttpGet("proposals")]
        public async Task<IActionResult> GetProposals()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var proposals = await _context.BudgetProposals
                .Include(p => p.Department)
                .Include(p => p.Creator)
                .Where(p => p.TenantID == tenantId && p.ProposalStatus != "Draft")
                .OrderByDescending(p => p.UpdatedAt)
                .ToListAsync();

            var approvedTotals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.ProposalStatus == "Approved")
                .GroupBy(p => p.DepartmentID)
                .Select(g => new { DeptId = g.Key, Spent = g.Sum(x => x.TotalAmount) })
                .ToDictionaryAsync(g => g.DeptId, g => g.Spent);

            return Ok(proposals.Select(p => new
            {
                id = p.ProposalID,
                title = p.Title,
                department = p.Department?.DepartmentName ?? "Unknown",
                departmentId = p.DepartmentID,
                departmentCap = p.Department?.AnnualBudgetCap ?? 0,
                departmentSpent = approvedTotals.ContainsKey(p.DepartmentID) ? approvedTotals[p.DepartmentID] : 0,
                amount = p.TotalAmount,
                status = p.ProposalStatus,
                submittedBy = p.Creator?.Name ?? "Unknown",
                priority = p.Priority,
                category = p.Category,
                justification = p.Justification,
                submittedDate = p.SubmittedAt.ToString("MMM dd, yyyy")
            }));
        }

        [HttpPost("proposals/{id:int}/approve")]
        public async Task<IActionResult> ApproveProposal(int id, [FromBody] ApproveRequest? req)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var proposal = await _context.BudgetProposals.FirstOrDefaultAsync(p => p.ProposalID == id && p.TenantID == tenantId);
            if (proposal == null) return NotFound(new { message = "Proposal not found." });

            if (req?.RejectedLineItemIds != null && req.RejectedLineItemIds.Any())
            {
                var lineItems = await _context.LineItems.Where(l => l.ProposalID == id).ToListAsync();
                foreach (var li in lineItems)
                {
                    if (req.RejectedLineItemIds.Contains(li.LineItemID))
                    {
                        li.IsRejected = true;
                    }
                }
                proposal.TotalAmount = lineItems.Where(l => !l.IsRejected).Sum(l => l.Quantity * l.UnitCost);
            }

            proposal.ProposalStatus = "Approved";
            proposal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Proposal approved successfully.", newTotal = proposal.TotalAmount });
        }

        [HttpPost("proposals/{id:int}/reject")]
        public async Task<IActionResult> RejectProposal(int id, [FromBody] ReviewRequest req)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var proposal = await _context.BudgetProposals.FirstOrDefaultAsync(p => p.ProposalID == id && p.TenantID == tenantId);
            if (proposal == null) return NotFound(new { message = "Proposal not found." });

            proposal.ProposalStatus = "Rejected";
            proposal.ReviewNotes = req.Notes;
            proposal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Proposal rejected." });
        }

        [HttpPost("proposals/{id:int}/request-changes")]
        public async Task<IActionResult> RequestChanges(int id, [FromBody] ReviewRequest req)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var proposal = await _context.BudgetProposals.FirstOrDefaultAsync(p => p.ProposalID == id && p.TenantID == tenantId);
            if (proposal == null) return NotFound(new { message = "Proposal not found." });

            proposal.ProposalStatus = "ChangesRequested";
            proposal.ReviewNotes = req.Notes;
            proposal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Changes requested." });
        }
    }

    public record ReviewRequest(string Notes);
    public record ApproveRequest(List<int> RejectedLineItemIds);
}
