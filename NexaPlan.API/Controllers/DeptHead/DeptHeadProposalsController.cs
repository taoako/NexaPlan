using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

namespace NexaPlan.API.Controllers.DeptHead
{
    [Route("api/dept-head")]
    [ApiController]
    public class DeptHeadProposalsController : DeptHeadBaseController
    {
        public DeptHeadProposalsController(AppDbContext context) : base(context) { }

        // GET api/dept-head/proposals — all proposals for the dept head's department
        [HttpGet("proposals")]
        public async Task<IActionResult> GetProposals()
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();

            // Find the department this user heads
            var user = await _context.Users.FindAsync(userId);
            int? deptId = user?.DepartmentID;

            var query = _context.BudgetProposals
                .Include(p => p.Department)
                .Include(p => p.Creator)
                .Where(p => p.TenantID == tenantId);

            // Dept heads see only their own department proposals
            if (deptId.HasValue)
                query = query.Where(p => p.DepartmentID == deptId.Value || p.CreatedBy == userId);
            else
                query = query.Where(p => p.CreatedBy == userId);

            var proposals = await query
                .OrderByDescending(p => p.UpdatedAt)
                .ToListAsync();

            var result = proposals.Select(p => new
            {
                proposalId = p.ProposalID,
                title = p.Title,
                category = p.Category,
                priority = p.Priority,
                status = p.ProposalStatus,
                totalAmount = p.TotalAmount,
                justification = p.Justification,
                reviewNotes = p.ReviewNotes,
                fiscalYear = p.FiscalYear,
                departmentName = p.Department?.DepartmentName ?? "Unknown",
                createdBy = p.Creator?.Name ?? "Unknown",
                submittedAt = p.SubmittedAt,
                updatedAt = p.UpdatedAt
            });

            return Ok(result);
        }

        // GET api/dept-head/proposals/{id}/line-items
        [HttpGet("proposals/{id:int}/line-items")]
        public async Task<IActionResult> GetLineItems(int id)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var proposal = await _context.BudgetProposals.FindAsync(id);
            if (proposal == null || proposal.TenantID != tenantId)
                return NotFound(new { message = "Proposal not found." });

            var items = await _context.LineItems
                .Where(li => li.ProposalID == id)
                .ToListAsync();

            return Ok(items.Select(li => new
            {
                lineItemId = li.LineItemID,
                description = li.Description,
                category = li.Category,
                quantity = li.Quantity,
                unitCost = li.UnitCost,
                total = li.Quantity * li.UnitCost,
                justification = li.Justification
            }));
        }

        // POST api/dept-head/proposals — create new proposal (draft or submit)
        [HttpPost("proposals")]
        public async Task<IActionResult> CreateProposal([FromBody] CreateProposalRequest req)
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();
            if (userId == 0) return NoUser();

            var user = await _context.Users.FindAsync(userId);
            int deptId = user?.DepartmentID ?? 0;

            decimal total = req.LineItems.Sum(li => li.Quantity * li.UnitCost);

            var proposal = new BudgetProposal
            {
                TenantID = tenantId,
                DepartmentID = deptId,
                CreatedBy = userId,
                FiscalYear = DateTime.UtcNow.Year,
                Title = req.Title,
                Category = req.Category,
                Priority = req.Priority,
                Justification = req.Justification,
                TotalAmount = total,
                ProposalStatus = req.SaveAsDraft ? "Draft" : "Pending",
                SubmittedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.BudgetProposals.Add(proposal);
            await _context.SaveChangesAsync();

            // Insert line items
            var lineItems = req.LineItems.Select(li => new LineItem
            {
                ProposalID = proposal.ProposalID,
                Description = li.Description,
                Category = req.Category,
                Quantity = li.Quantity,
                UnitCost = li.UnitCost,
                Justification = li.Justification ?? string.Empty
            }).ToList();

            _context.LineItems.AddRange(lineItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = req.SaveAsDraft ? "Draft saved." : "Proposal submitted for review.", proposalId = proposal.ProposalID });
        }

        // PUT api/dept-head/proposals/{id} — update draft or changes-requested proposal
        [HttpPut("proposals/{id:int}")]
        public async Task<IActionResult> UpdateProposal(int id, [FromBody] CreateProposalRequest req)
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();

            var proposal = await _context.BudgetProposals.FindAsync(id);
            if (proposal == null || proposal.TenantID != tenantId)
                return NotFound(new { message = "Proposal not found." });

            if (proposal.ProposalStatus != "Draft" && proposal.ProposalStatus != "ChangesRequested")
                return BadRequest(new { message = "Only Draft or Changes Requested proposals can be edited." });

            decimal total = req.LineItems.Sum(li => li.Quantity * li.UnitCost);

            proposal.Title = req.Title;
            proposal.Category = req.Category;
            proposal.Priority = req.Priority;
            proposal.Justification = req.Justification;
            proposal.TotalAmount = total;
            proposal.ProposalStatus = req.SaveAsDraft ? "Draft" : "Pending";
            proposal.UpdatedAt = DateTime.UtcNow;
            proposal.ReviewNotes = null; // Clear after resubmit

            // Replace line items
            var oldItems = _context.LineItems.Where(li => li.ProposalID == id);
            _context.LineItems.RemoveRange(oldItems);

            var newItems = req.LineItems.Select(li => new LineItem
            {
                ProposalID = id,
                Description = li.Description,
                Category = req.Category,
                Quantity = li.Quantity,
                UnitCost = li.UnitCost,
                Justification = li.Justification ?? string.Empty
            }).ToList();

            _context.LineItems.AddRange(newItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = req.SaveAsDraft ? "Draft updated." : "Proposal resubmitted." });
        }

        // POST api/dept-head/proposals/{id}/clone — duplicate proposal
        [HttpPost("proposals/{id:int}/clone")]
        public async Task<IActionResult> CloneProposal(int id)
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();

            var original = await _context.BudgetProposals.FindAsync(id);
            if (original == null || original.TenantID != tenantId)
                return NotFound(new { message = "Proposal not found." });

            var clone = new BudgetProposal
            {
                TenantID = original.TenantID,
                DepartmentID = original.DepartmentID,
                CreatedBy = userId,
                FiscalYear = DateTime.UtcNow.Year,
                Title = $"[Copy] {original.Title}",
                Category = original.Category,
                Priority = original.Priority,
                Justification = original.Justification,
                TotalAmount = original.TotalAmount,
                ProposalStatus = "Draft",
                SubmittedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.BudgetProposals.Add(clone);
            await _context.SaveChangesAsync();

            var originalItems = await _context.LineItems.Where(li => li.ProposalID == id).ToListAsync();
            var clonedItems = originalItems.Select(li => new LineItem
            {
                ProposalID = clone.ProposalID,
                Description = li.Description,
                Category = li.Category,
                Quantity = li.Quantity,
                UnitCost = li.UnitCost,
                Justification = li.Justification
            }).ToList();
            _context.LineItems.AddRange(clonedItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Proposal cloned as draft.", proposalId = clone.ProposalID });
        }

        // GET api/dept-head/overview — summary stats for the department
        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview()
        {
            var tenantId = GetTenantId();
            var userId = GetUserId();
            if (tenantId == 0) return NoTenant();

            var user = await _context.Users.Include(u => u.Department).FirstOrDefaultAsync(u => u.UserID == userId);
            var dept = user?.Department;

            var proposals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && (p.DepartmentID == (dept != null ? dept.DepartmentID : 0) || p.CreatedBy == userId))
                .ToListAsync();

            decimal budgetCap = dept?.AnnualBudgetCap ?? 0;
            decimal approved = proposals.Where(p => p.ProposalStatus == "Approved").Sum(p => p.TotalAmount);
            decimal remaining = budgetCap - approved;
            int activeProposals = proposals.Count(p => p.ProposalStatus == "Pending");
            int draftCount = proposals.Count(p => p.ProposalStatus == "Draft");

            // Monthly spend (simplified — based on approved proposals UpdatedAt month)
            var monthlyData = Enumerable.Range(1, 12).Select(m =>
            {
                decimal spent = proposals
                    .Where(p => p.ProposalStatus == "Approved" && p.UpdatedAt.Month == m && p.UpdatedAt.Year == DateTime.UtcNow.Year)
                    .Sum(p => p.TotalAmount);
                decimal pct = budgetCap > 0 ? (spent / budgetCap) * 100 : 0;
                return new { month = m, spentAmount = spent, percentage = Math.Round(pct, 1) };
            }).ToList();

            // Active scenario
            var scenario = await _context.BudgetScenarios
                .Where(s => s.TenantID == tenantId && s.IsActive)
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            return Ok(new
            {
                departmentName = dept?.DepartmentName ?? "Your Department",
                allocatedBudget = budgetCap,
                spentToDate = approved,
                remaining = remaining,
                utilizationPct = budgetCap > 0 ? Math.Round((approved / budgetCap) * 100, 1) : 0,
                activeProposals,
                draftCount,
                totalProposals = proposals.Count,
                monthlyData,
                activeScenario = scenario == null ? null : new
                {
                    scenarioId = scenario.ScenarioID,
                    scenarioName = scenario.ScenarioName,
                    multiplier = scenario.AdjustmentMultiplier
                }
            });
        }
    }

    // DTO Records
    public record CreateProposalRequest(
        string Title,
        string Category,
        string Priority,
        string Justification,
        bool SaveAsDraft,
        List<LineItemRequest> LineItems
    );

    public record LineItemRequest(
        string Description,
        int Quantity,
        decimal UnitCost,
        string? Justification
    );
}
