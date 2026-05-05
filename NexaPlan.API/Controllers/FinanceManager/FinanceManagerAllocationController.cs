using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.FinanceManager
{
    [Route("api/finance-manager")]
    [ApiController]
    public class FinanceManagerAllocationController : FinanceManagerBaseController
    {
        public FinanceManagerAllocationController(AppDbContext context) : base(context) { }

        [HttpGet("allocations")]
        public async Task<IActionResult> GetAllocations()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var departments = await _context.Departments
                .Where(d => d.TenantID == tenantId)
                .ToListAsync();

            var proposals = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.ProposalStatus == "Approved")
                .ToListAsync();

            decimal totalCap = departments.Sum(d => d.AnnualBudgetCap);

            var allocations = departments.Select(d => {
                var deptProposals = proposals.Where(p => p.DepartmentID == d.DepartmentID).ToList();
                decimal proposalSpent = deptProposals.Sum(p => p.TotalAmount);
                // Use reconciled ActualSpent as the authoritative actual spending figure
                decimal spent = d.ActualSpent;
                decimal pct = totalCap > 0 ? ((decimal)d.AnnualBudgetCap / totalCap) * 100 : 0;

                return new
                {
                    departmentId = d.DepartmentID,
                    name = d.DepartmentName,
                    amount = d.AnnualBudgetCap, // Their allocation cap
                    pct = pct,
                    spent = spent,
                    approvedProposals = deptProposals.Select(p => new {
                        id = p.ProposalID,
                        title = p.Title,
                        amount = p.TotalAmount,
                        date = p.UpdatedAt.ToString("MMM dd, yyyy")
                    })
                };
            }).ToList();

            var totalAllocated = totalCap;
            var pendingRequests = await _context.BudgetProposals.CountAsync(p => p.TenantID == tenantId && p.ProposalStatus == "Pending");
            var approvedThisMonth = await _context.BudgetProposals.Where(p => p.TenantID == tenantId && p.ProposalStatus == "Approved" && p.UpdatedAt.Month == DateTime.UtcNow.Month).SumAsync(p => p.TotalAmount);
            var approvedCountThisMonth = await _context.BudgetProposals.CountAsync(p => p.TenantID == tenantId && p.ProposalStatus == "Approved" && p.UpdatedAt.Month == DateTime.UtcNow.Month);

            return Ok(new
            {
                totalAllocated = totalAllocated,
                pendingRequests = pendingRequests,
                approvedThisMonth = approvedThisMonth,
                approvedCountThisMonth = approvedCountThisMonth,
                activeDepartments = departments.Count,
                departments = allocations
            });
        }

        [HttpPost("allocations/transfer")]
        public async Task<IActionResult> TransferFunds([FromBody] TransferRequest req)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var fromDept = await _context.Departments.FirstOrDefaultAsync(d => d.TenantID == tenantId && d.DepartmentName == req.From);
            var toDept = await _context.Departments.FirstOrDefaultAsync(d => d.TenantID == tenantId && d.DepartmentName == req.To);

            if (fromDept == null || toDept == null)
                return BadRequest(new { message = "Invalid department names." });

            if (fromDept.AnnualBudgetCap < req.Amount)
                return BadRequest(new { message = "Insufficient funds in the source department." });

            fromDept.AnnualBudgetCap -= req.Amount;
            toDept.AnnualBudgetCap += req.Amount;

            _context.AuditLogs.Add(new Models.AuditLog {
                TenantID = tenantId,
                UserID = GetUserId(),
                ActionType = "FUNDS_TRANSFERRED",
                TargetResources = $"{req.From} -> {req.To}",
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Funds transferred successfully." });
        }
    }

    public record TransferRequest(string From, string To, decimal Amount);
}
