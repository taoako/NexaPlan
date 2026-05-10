using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;

namespace NexaPlan.API.Controllers.FinanceManager;

[ApiController]
[Route("api/finance-manager/forecast")]
public class FinanceManagerForecastController : FinanceManagerBaseController
{
    private readonly IHttpClientFactory _http;
    private const string ML_SERVICE_URL = "http://localhost:8001";

    private static readonly string[] Months =
        { "JAN","FEB","MAR","APR","MAY","JUN",
          "JUL","AUG","SEP","OCT","NOV","DEC" };

    public FinanceManagerForecastController(
        IHttpClientFactory http,
        AppDbContext context) : base(context)
    {
        _http = http;
    }

    // GET /api/finance-manager/forecast?fiscalYear=2026
    [HttpGet]
    public async Task<IActionResult> GetForecast([FromQuery] int fiscalYear = 2026)
    {
        var tenantId = GetTenantId();
        if (tenantId == 0) return NoTenant();

        var client = _http.CreateClient();

        // 1. Load all active departments for this tenant
        var departments = await _context.Departments
            .Where(d => d.TenantID == tenantId)
            .ToListAsync();

        if (!departments.Any())
            return Ok(BuildEmptyResponse());

        // 2. Load budget allocations for the fiscal year
        var deptIds = departments.Select(d => d.DepartmentID).ToList();
        var allocations = await _context.DepartmentAllocations
            .Where(a => a.FiscalYear == fiscalYear && deptIds.Contains(a.DepartmentID))
            .ToListAsync();

        // 3. Build forecasts — one prediction per dept × month
        var deptForecasts = new List<DeptForecastDto>();

        foreach (var dept in departments)
        {
            var annualCap = allocations
                .FirstOrDefault(a => a.DepartmentID == dept.DepartmentID)
                ?.TotalAllocatedCap
                ?? dept.AnnualBudgetCap;

            var monthlyBudget = (double)(annualCap / 12);
            var monthlyForecasts = new List<MonthForecastDto>();

            foreach (var month in Months)
            {
                try
                {
                    var payload  = new MlPredictRequest(monthlyBudget, dept.DepartmentName, month);
                    var response = await client.PostAsJsonAsync(
                        $"{ML_SERVICE_URL}/predict", payload);

                    if (!response.IsSuccessStatusCode) continue;

                    var pred = await response.Content
                        .ReadFromJsonAsync<MlPredictResponse>();

                    if (pred is null) continue;

                    monthlyForecasts.Add(new MonthForecastDto(
                        month,
                        Math.Round(monthlyBudget, 2),
                        pred.predicted_spending,
                        pred.variance_pct,
                        pred.risk_level));
                }
                catch
                {
                    // If ML service is unavailable for a month, skip gracefully
                    continue;
                }
            }

            deptForecasts.Add(new DeptForecastDto(
                dept.DepartmentID,
                dept.DepartmentName,
                (double)annualCap,
                (double)dept.ActualSpent,
                monthlyForecasts));
        }

        // 4. Compute org-level KPIs
        var projectedEOY  = deptForecasts.Sum(d =>
            d.MonthlyForecasts.Sum(m => m.PredictedSpending));
        var totalBudget   = deptForecasts.Sum(d => d.AnnualBudget);
        var variancePct   = totalBudget > 0
            ? (projectedEOY - totalBudget) / totalBudget * 100 : 0;
        var depletionRisk = variancePct > 15 ? "High"
                          : variancePct > 5  ? "Medium" : "Low";

        // 5. Generate AI insight cards automatically
        var insights = GenerateInsights(deptForecasts);

        return Ok(new ForecastSummaryDto(
            Math.Round(projectedEOY, 2),
            Math.Round(totalBudget,  2),
            Math.Round(variancePct,  2),
            depletionRisk,
            81.66,
            deptForecasts,
            insights));
    }

    private static List<InsightDto> GenerateInsights(List<DeptForecastDto> depts)
    {
        var insights = new List<InsightDto>();

        foreach (var dept in depts)
        {
            if (!dept.MonthlyForecasts.Any()) continue;

            // Warning: months forecast as High risk
            var highRiskMonths = dept.MonthlyForecasts
                .Where(m => m.RiskLevel == "High").ToList();

            if (highRiskMonths.Any())
            {
                var avgOverage = highRiskMonths.Average(m => m.VariancePct);
                insights.Add(new InsightDto(
                    "warning",
                    $"Budget overrun risk — {dept.DepartmentName}",
                    $"{dept.DepartmentName} is forecast to exceed its monthly budget " +
                    $"in {highRiskMonths.Count} month(s) with an average overage of " +
                    $"{avgOverage:F1}%. Review proposals before these periods.",
                    "81.7%"));
            }

            // Optimization: consistently under budget (3+ months under by >8%)
            var underBudgetMonths = dept.MonthlyForecasts
                .Where(m => m.VariancePct < -8).ToList();

            if (underBudgetMonths.Count >= 3)
            {
                var savingsTotal = underBudgetMonths
                    .Sum(m => Math.Abs(m.PredictedSpending - m.BudgetedAmount));
                insights.Add(new InsightDto(
                    "optimization",
                    $"Reallocation opportunity — {dept.DepartmentName}",
                    $"{dept.DepartmentName} is projected to underspend its budget " +
                    $"in {underBudgetMonths.Count} months. " +
                    $"Consider reallocating ₱{savingsTotal:N0} to departments at risk.",
                    "81.7%"));
            }

            // Success: all months Low risk
            if (dept.MonthlyForecasts.All(m => m.RiskLevel == "Low"))
            {
                insights.Add(new InsightDto(
                    "success",
                    $"Consistent efficiency — {dept.DepartmentName}",
                    $"{dept.DepartmentName} is forecast to remain within budget " +
                    $"across all months. No intervention required.",
                    "81.7%"));
            }
        }

        return insights.Take(4).ToList(); // cap at 4 to match UI layout
    }

    private static ForecastSummaryDto BuildEmptyResponse() =>
        new(0, 0, 0, "Low", 81.66,
            new List<DeptForecastDto>(),
            new List<InsightDto>());
}
