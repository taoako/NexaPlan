using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;

namespace NexaPlan.API.Controllers.DeptHead
{
    [Route("api/dept-head/forecast")]
    [ApiController]
    public class DeptHeadForecastController : DeptHeadBaseController
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private const string ML_SERVICE_URL = "http://localhost:8001";

        public DeptHeadForecastController(AppDbContext context, IHttpClientFactory httpClientFactory) : base(context)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("risk")]
        public async Task<IActionResult> GetSpendingRisk()
        {
            var tenantId = GetTenantId();
            if (tenantId == 0) return NoTenant();

            var deptId = await GetDepartmentIdAsync();
            if (deptId == 0) return BadRequest(new { message = "Department not found for user." });

            var dept = await _context.Departments.FindAsync(deptId);
            if (dept == null) return NotFound(new { message = "Department record missing." });

            // Monthly cap: use DepartmentAllocation if present, else AnnualBudgetCap / 12
            var fiscalYear = DateTime.UtcNow.Year;
            var allocation = await _context.DepartmentAllocations
                .FirstOrDefaultAsync(a => a.TenantID == tenantId && a.DepartmentID == deptId && a.FiscalYear == fiscalYear);
            
            var annualCap = allocation?.TotalAllocatedCap ?? dept.AnnualBudgetCap;
            var monthlyCap = (double)(annualCap / 12m);
            if (monthlyCap <= 0) monthlyCap = 1000;

            var month = DateTime.UtcNow.ToString("MMM").ToUpper();
            var payload = new MlPredictRequest(monthlyCap, dept.DepartmentName, month);
            
            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.PostAsJsonAsync($"{ML_SERVICE_URL}/predict", payload);
                if (response.IsSuccessStatusCode)
                {
                    var pred = await response.Content.ReadFromJsonAsync<MlPredictResponse>();
                    if (pred != null)
                    {
                        return Ok(new
                        {
                            riskLevel = pred.risk_level,
                            predictedSpending = pred.predicted_spending,
                            budgetCap = monthlyCap,
                            month = month,
                            deptName = dept.DepartmentName,
                            variancePct = pred.variance_pct
                        });
                    }
                }
            }
            catch { /* ML service down? */ }

            return StatusCode(503, new { message = "ML Prediction service unavailable." });
        }
    }
}
