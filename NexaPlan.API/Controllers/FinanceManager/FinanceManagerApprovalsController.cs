using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;

namespace NexaPlan.API.Controllers.FinanceManager
{
    [Route("api/finance-manager")]
    [ApiController]
    public class FinanceManagerApprovalsController : FinanceManagerBaseController
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private const string ML_SERVICE_URL = "http://localhost:8001";

        public FinanceManagerApprovalsController(AppDbContext context, IHttpClientFactory httpClientFactory) : base(context) 
        { 
            _httpClientFactory = httpClientFactory;
        }

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

            var approvedTotalsRows = await _context.BudgetProposals
                .Where(p => p.TenantID == tenantId && p.ProposalStatus == "Approved")
                .Select(p => new { p.DepartmentID, p.RequestedAmount, p.TotalAmount })
                .ToListAsync();

            var approvedTotals = approvedTotalsRows
                .GroupBy(p => p.DepartmentID)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.RequestedAmount > 0 ? x.RequestedAmount : x.TotalAmount));

            var fiscalYear = DateTime.UtcNow.Year;
            var allocationCaps = await _context.DepartmentAllocations
                .Where(a => a.TenantID == tenantId && a.FiscalYear == fiscalYear)
                .ToDictionaryAsync(a => a.DepartmentID, a => a.TotalAllocatedCap);

            var resultList = new List<object>();
            var client = _httpClientFactory.CreateClient();

            foreach (var p in proposals)
            {
                string? riskLevel = null;
                string? mlContext = null;
                var amount = p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount;

                if (p.ProposalStatus == "Pending")
                {
                    try
                    {
                        var deptName = p.Department?.DepartmentName ?? "Unknown";
                        var month = !string.IsNullOrEmpty(p.PlannedMonth) ? p.PlannedMonth : DateTime.UtcNow.ToString("MMM").ToUpper();
                        
                        decimal deptCap = allocationCaps.ContainsKey(p.DepartmentID) ? allocationCaps[p.DepartmentID] : (p.Department?.AnnualBudgetCap ?? 0);
                        double monthlyCap = (double)(deptCap / 12);
                        if (monthlyCap <= 0) monthlyCap = 1000; // Fallback for ML model safety

                        var payload = new DTOs.MlPredictRequest(monthlyCap, deptName, month);
                        var response = await client.PostAsJsonAsync($"{ML_SERVICE_URL}/predict", payload);
                        if (response.IsSuccessStatusCode)
                        {
                            var pred = await response.Content.ReadFromJsonAsync<DTOs.MlPredictResponse>();
                            if (pred != null)
                            {
                                riskLevel = pred.risk_level;
                                var totalPct = 100 + pred.variance_pct;
                                mlContext = $"{deptName} in {month} historically spends {totalPct:F0}% of budget";
                            }
                        }
                    }
                    catch { /* Ignore ML errors */ }
                }

                resultList.Add(new
                {
                    id = p.ProposalID,
                    title = p.Title,
                    department = p.Department?.DepartmentName ?? "Unknown",
                    departmentId = p.DepartmentID,
                    departmentCap = allocationCaps.ContainsKey(p.DepartmentID) ? allocationCaps[p.DepartmentID] : (p.Department?.AnnualBudgetCap ?? 0),
                    departmentSpent = approvedTotals.ContainsKey(p.DepartmentID) ? approvedTotals[p.DepartmentID] : 0,
                    amount = amount,
                    status = p.ProposalStatus,
                    submittedBy = p.Creator?.Name ?? "Unknown",
                    priority = p.Priority,
                    category = p.Category,
                    justification = p.Justification,
                    plannedMonth = p.PlannedMonth,
                    plannedYear = p.PlannedYear,
                    submittedDate = p.SubmittedAt.ToString("MMM dd, yyyy"),
                    mlRiskLevel = riskLevel,
                    mlContext = mlContext
                });
            }

            return Ok(resultList);
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
                proposal.RequestedAmount = proposal.TotalAmount;
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
