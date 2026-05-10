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

            var fiscalYear = DateTime.UtcNow.Year;
            var allocationRows = await _context.DepartmentAllocations
                .Where(a => a.TenantID == tenantId && a.FiscalYear == fiscalYear)
                .ToListAsync();

            var departmentCaps = departments.Select(d => new
            {
                d.DepartmentID,
                Cap = allocationRows.FirstOrDefault(a => a.DepartmentID == d.DepartmentID)?.TotalAllocatedCap ?? d.AnnualBudgetCap
            }).ToList();

            decimal totalCap = departmentCaps.Sum(d => d.Cap);

            var allocationData = departments.Select(d =>
            {
                var allocationCap = departmentCaps.First(c => c.DepartmentID == d.DepartmentID).Cap;
                var deptProposals = proposals.Where(p => p.DepartmentID == d.DepartmentID).ToList();
                decimal proposalSpent = deptProposals.Sum(p => p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount);
                // Use reconciled ActualSpent as the authoritative actual spending figure
                decimal spent = d.ActualSpent;
                decimal pct = totalCap > 0 ? (allocationCap / totalCap) * 100 : 0;

                return new
                {
                    departmentId = d.DepartmentID,
                    name = d.DepartmentName,
                    amount = allocationCap, // Their allocation cap
                    pct = pct,
                    spent = spent,
                    approvedProposals = deptProposals.Select(p => new
                    {
                        id = p.ProposalID,
                        title = p.Title,
                        amount = p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount,
                        date = p.UpdatedAt.ToString("MMM dd, yyyy")
                    })
                };
            }).ToList();

            var totalAllocated = totalCap;
            var pendingRequests = await _context.BudgetProposals.CountAsync(p => p.TenantID == tenantId && p.ProposalStatus == "Pending");
            var approvedThisMonthRows = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.ProposalStatus == "Approved" && p.UpdatedAt.Month == DateTime.UtcNow.Month)
                .Select(p => new { p.RequestedAmount, p.TotalAmount })
                .ToListAsync();
            var approvedThisMonth = approvedThisMonthRows.Sum(p => p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount);
            var approvedCountThisMonth = await _context.BudgetProposals.CountAsync(p => p.TenantID == tenantId && p.ProposalStatus == "Approved" && p.UpdatedAt.Month == DateTime.UtcNow.Month);

            return Ok(new
            {
                totalAllocated = totalAllocated,
                pendingRequests = pendingRequests,
                approvedThisMonth = approvedThisMonth,
                approvedCountThisMonth = approvedCountThisMonth,
                activeDepartments = departments.Count,
                departments = allocationData
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

            if (req.Amount <= 0)
                return BadRequest(new { message = "Transfer amount must be greater than zero." });

            var fiscalYear = DateTime.UtcNow.Year;
            var allocationRows = await _context.DepartmentAllocations
                .Where(a => a.TenantID == tenantId && a.FiscalYear == fiscalYear)
                .ToListAsync();

            var fromCap = allocationRows.FirstOrDefault(a => a.DepartmentID == fromDept.DepartmentID)?.TotalAllocatedCap ?? fromDept.AnnualBudgetCap;
            var toCap = allocationRows.FirstOrDefault(a => a.DepartmentID == toDept.DepartmentID)?.TotalAllocatedCap ?? toDept.AnnualBudgetCap;

            if (fromCap < req.Amount)
                return BadRequest(new { message = "Insufficient funds in the source department." });

            var approvedRows = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.DepartmentID == fromDept.DepartmentID && p.ProposalStatus == "Approved")
                .Select(p => new { p.RequestedAmount, p.TotalAmount })
                .ToListAsync();

            var approvedTotal = approvedRows.Sum(p => p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount);
            var protectedSpend = Math.Max(approvedTotal, fromDept.ActualSpent);
            var remainingCap = fromCap - req.Amount;

            if (protectedSpend > 0 && remainingCap < protectedSpend)
            {
                return BadRequest(new
                {
                    message = "Transfer would compromise approved budgets for the source department.",
                    approvedTotal = approvedTotal,
                    actualSpent = fromDept.ActualSpent,
                    currentCap = fromCap,
                    proposedCap = remainingCap
                });
            }

            fromDept.AnnualBudgetCap = remainingCap;
            toDept.AnnualBudgetCap = toCap + req.Amount;

            var fromAllocation = allocationRows.FirstOrDefault(a => a.DepartmentID == fromDept.DepartmentID);
            var toAllocation = allocationRows.FirstOrDefault(a => a.DepartmentID == toDept.DepartmentID);

            if (fromAllocation == null)
            {
                fromAllocation = new Models.DepartmentAllocation
                {
                    TenantID = tenantId,
                    DepartmentID = fromDept.DepartmentID,
                    FiscalYear = fiscalYear,
                    TotalAllocatedCap = remainingCap,
                    SetByAdminID = GetUserId(),
                    SetAt = DateTime.UtcNow
                };
                _context.DepartmentAllocations.Add(fromAllocation);
            }
            else
            {
                fromAllocation.TotalAllocatedCap = remainingCap;
                fromAllocation.SetAt = DateTime.UtcNow;
                fromAllocation.SetByAdminID = GetUserId();
            }

            if (toAllocation == null)
            {
                toAllocation = new Models.DepartmentAllocation
                {
                    TenantID = tenantId,
                    DepartmentID = toDept.DepartmentID,
                    FiscalYear = fiscalYear,
                    TotalAllocatedCap = toCap + req.Amount,
                    SetByAdminID = GetUserId(),
                    SetAt = DateTime.UtcNow
                };
                _context.DepartmentAllocations.Add(toAllocation);
            }
            else
            {
                toAllocation.TotalAllocatedCap = toCap + req.Amount;
                toAllocation.SetAt = DateTime.UtcNow;
                toAllocation.SetByAdminID = GetUserId();
            }

            _context.AuditLogs.Add(new Models.AuditLog
            {
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

        [HttpPost("allocations/set")]
        public async Task<IActionResult> SetAllocation([FromBody] SetAllocationRequest req)
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();
            if (req.Amount < 0) return BadRequest(new { message = "Allocation amount must be zero or greater." });

            var dept = await _context.Departments.FirstOrDefaultAsync(d => d.TenantID == tenantId && d.DepartmentID == req.DepartmentId);
            if (dept == null) return BadRequest(new { message = "Department not found." });

            var approvedRows = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.DepartmentID == dept.DepartmentID && p.ProposalStatus == "Approved")
                .Select(p => new { p.RequestedAmount, p.TotalAmount })
                .ToListAsync();

            var approvedTotal = approvedRows.Sum(p => p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount);
            var protectedSpend = Math.Max(approvedTotal, dept.ActualSpent);

            if (protectedSpend > 0 && req.Amount < protectedSpend)
            {
                return BadRequest(new
                {
                    message = "Allocation cannot be set below approved budgets or actual spend.",
                    approvedTotal = approvedTotal,
                    actualSpent = dept.ActualSpent,
                    requestedCap = req.Amount
                });
            }

            var fiscalYear = DateTime.UtcNow.Year;
            var allocation = await _context.DepartmentAllocations
                .FirstOrDefaultAsync(a => a.TenantID == tenantId && a.DepartmentID == dept.DepartmentID && a.FiscalYear == fiscalYear);

            if (allocation == null)
            {
                allocation = new Models.DepartmentAllocation
                {
                    TenantID = tenantId,
                    DepartmentID = dept.DepartmentID,
                    FiscalYear = fiscalYear,
                    TotalAllocatedCap = req.Amount,
                    SetByAdminID = GetUserId(),
                    SetAt = DateTime.UtcNow
                };
                _context.DepartmentAllocations.Add(allocation);
            }
            else
            {
                allocation.TotalAllocatedCap = req.Amount;
                allocation.SetByAdminID = GetUserId();
                allocation.SetAt = DateTime.UtcNow;
            }

            dept.AnnualBudgetCap = req.Amount;

            _context.AuditLogs.Add(new Models.AuditLog
            {
                TenantID = tenantId,
                UserID = GetUserId(),
                ActionType = "ALLOCATION_SET",
                TargetResources = $"Dept:{dept.DepartmentName} Cap:₱{req.Amount}",
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Allocation updated successfully." });
        }
    }

    public record TransferRequest(string From, string To, decimal Amount);
    public record SetAllocationRequest(int DepartmentId, decimal Amount);
}
