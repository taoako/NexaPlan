using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.DTOs;

namespace NexaPlan.API.Controllers.FinanceManager;

[ApiController]
[Route("api/finance-manager/forecast")]
public class FinanceManagerAnalyticsController : FinanceManagerBaseController
{
    private readonly IHttpClientFactory _http;

    private static readonly string[] MonthNames =
        { "JAN","FEB","MAR","APR","MAY","JUN",
          "JUL","AUG","SEP","OCT","NOV","DEC" };

    public FinanceManagerAnalyticsController(AppDbContext context, IHttpClientFactory http) : base(context)
    {
        _http = http;
    }

    // GET /api/finance-manager/forecast?fiscalYear=2026
    [HttpGet]
    public async Task<IActionResult> GetForecast([FromQuery] int fiscalYear = 2026)
    {
        var tenantId = GetTenantId();
        if (tenantId == 0) return NoTenant();

        var departments = await _context.Departments
            .Where(d => d.TenantID == tenantId)
            .ToListAsync();

        if (!departments.Any()) return Ok(BuildEmptyResponse());

        var deptIds = departments.Select(d => d.DepartmentID).ToList();
        var allocations = await _context.DepartmentAllocations
            .Where(a => a.FiscalYear == fiscalYear && deptIds.Contains(a.DepartmentID))
            .ToListAsync();

        // Org-level monthly accumulators (1-indexed, index 0 unused)
        var actualByMonth = new double[13];
        var approvedByMonth = new double[13];
        var pendingByMonth = new double[13];
        var budgetByMonth = new double[13];
        var mlUpperByMonth = new double[13];
        var mlLowerByMonth = new double[13];

        var deptForecasts = new List<DeptForecastDto>();
        var client = _http.CreateClient("MlService");
        client.Timeout = TimeSpan.FromSeconds(5);

        foreach (var dept in departments)
        {
            var annualCap = (double)(allocations
                .FirstOrDefault(a => a.DepartmentID == dept.DepartmentID)
                ?.TotalAllocatedCap ?? dept.AnnualBudgetCap);
            var monthlyBudget = annualCap / 12;

            // ── ACTUAL line: reconciled expenses grouped by receipt date first,
            //    then fallback to reconciled/submitted date for legacy rows.
            var reconciledExpenses = await _context.Expenses
                .Where(e => e.Status == "Reconciled"
                         && e.TenantID == tenantId
                         && e.DepartmentID == dept.DepartmentID)
                .Select(e => new
                {
                    e.Amount,
                    e.ExpenseDate,
                    e.ReconciledAt,
                    e.SubmittedAt
                })
                .ToListAsync();

            Console.WriteLine($"[ANALYTICS] Dept={dept.DepartmentName} | Reconciled expenses found={reconciledExpenses.Count}");

            var reconciledByMonth = reconciledExpenses
                .Where(e => (e.ExpenseDate ?? e.ReconciledAt ?? e.SubmittedAt).Year == fiscalYear)
                .GroupBy(e => ResolveMonthIndex(null, e.ExpenseDate ?? e.ReconciledAt ?? e.SubmittedAt))
                .Where(g => g.Key.HasValue)
                .ToDictionary(g => g.Key!.Value, g => (double)g.Sum(e => (double)e.Amount));

            Console.WriteLine($"[ANALYTICS] Dept={dept.DepartmentName} | Expenses matching fiscalYear={fiscalYear}: {reconciledByMonth.Count} month(s) with data");

            // ── COMMITTED (Projected) line: approved proposals by normalized planned month
            var approvedProposals = await _context.BudgetProposals
                .Where(p => p.DepartmentID == dept.DepartmentID
                         && p.TenantID == tenantId
                         && p.ProposalStatus == "Approved"
                         && (p.PlannedYear ?? (p.FiscalYear > 0 ? p.FiscalYear : p.SubmittedAt.Year)) == fiscalYear)
                .Select(p => new
                {
                    p.PlannedMonth,
                    p.SubmittedAt,
                    Amount = p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount
                })
                .ToListAsync();

            var approvedByMonthMap = BuildMonthlyTotals(
                approvedProposals.Select(p => (p.PlannedMonth, (DateTime?)p.SubmittedAt, (double)p.Amount)));

            Console.WriteLine($"[ANALYTICS] Dept={dept.DepartmentName} | Approved proposals found={approvedProposals.Count} | Months with committed data={approvedByMonthMap.Count}");

            // ── UPPER BOUND: approved + pending proposals (worst case all get approved)
            var pendingProposals = await _context.BudgetProposals
                .Where(p => p.DepartmentID == dept.DepartmentID
                         && p.TenantID == tenantId
                         && p.ProposalStatus == "Pending"
                         && (p.PlannedYear ?? (p.FiscalYear > 0 ? p.FiscalYear : p.SubmittedAt.Year)) == fiscalYear)
                .Select(p => new
                {
                    p.PlannedMonth,
                    p.SubmittedAt,
                    Amount = p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount
                })
                .ToListAsync();

            var pendingByMonthMap = BuildMonthlyTotals(
                pendingProposals.Select(p => (p.PlannedMonth, (DateTime?)p.SubmittedAt, (double)p.Amount)));

            // Accumulate org-level totals
            for (int m = 1; m <= 12; m++)
            {
                budgetByMonth[m] += monthlyBudget;
                actualByMonth[m] += reconciledByMonth.TryGetValue(m, out var actualTotal) ? actualTotal : 0;
                approvedByMonth[m] += approvedByMonthMap.TryGetValue(m, out var approvedTotal) ? approvedTotal : 0;
                pendingByMonth[m] += pendingByMonthMap.TryGetValue(m, out var pendingTotal) ? pendingTotal : 0;
            }

            // ── Per-dept monthly breakdown with ML risk dots ──────────────────────────
            var monthlyForecasts = new List<MonthForecastDto>();

            for (int i = 0; i < 12; i++)
            {
                var monthStr = MonthNames[i];
                var monthInt = i + 1;
                var actual = reconciledByMonth.TryGetValue(monthInt, out var actualMonthTotal) ? actualMonthTotal : 0;
                var committed = approvedByMonthMap.TryGetValue(monthInt, out var committedMonthTotal) ? committedMonthTotal : 0;
                var varPct = monthlyBudget > 0 ? (committed - monthlyBudget) / monthlyBudget * 100 : 0;
                var riskLevel = varPct > 15 ? "High" : varPct > 5 ? "Medium" : "Low";

                // ML risk signal: RF model predicts utilization ratio for this dept+month
                double mlPredicted = 0;
                string mlRisk = "Low";
                double mlUpper = 0;
                double mlLower = 0;
                string mlModel = "";
                string mlNote = "";

                try
                {
                    if (monthlyBudget > 0)
                    {
                        var payload = new MlPredictRequest(monthlyBudget, dept.DepartmentName, monthStr);
                        var mlResp = await client.PostAsJsonAsync("predict", payload);
                        if (mlResp.IsSuccessStatusCode)
                        {
                            var pred = await mlResp.Content.ReadFromJsonAsync<MlPredictResponse>();
                            if (pred != null)
                            {
                                mlPredicted = pred.predicted_spending;
                                mlRisk = pred.risk_level;
                                mlUpper = pred.upper_bound;
                                mlLower = pred.lower_bound;
                                mlModel = pred.model_used;
                                mlNote = pred.confidence_note;
                            }
                        }
                    }
                }
                catch { /* ML is additive — never block */ }

                mlUpperByMonth[monthInt] += mlUpper;
                mlLowerByMonth[monthInt] += mlLower;

                monthlyForecasts.Add(new MonthForecastDto(
                    monthStr,
                    Math.Round(monthlyBudget, 2),
                    Math.Round(actual, 2),
                    Math.Round(committed, 2),
                    Math.Round(varPct, 2),
                    riskLevel,
                    Math.Round(mlPredicted, 2),
                    mlRisk,
                    Math.Round(mlUpper, 2),
                    Math.Round(mlLower, 2),
                    mlModel,
                    mlNote));
            }

            deptForecasts.Add(new DeptForecastDto(
                dept.DepartmentID,
                dept.DepartmentName,
                annualCap,
                (double)dept.ActualSpent,
                monthlyForecasts));
        }

        // ── Org-level trend forecast from real historical data ─────────────────────
        var orgActuals = Enumerable.Range(1, 12).Select(m => actualByMonth[m]).ToList();
        var monthsWithData = orgActuals.Count(v => v > 0);
        List<TrendPoint>? trendPts = null;
        string trendMethod = "none";

        if (monthsWithData >= 3)
        {
            var lastIdx = orgActuals.FindLastIndex(v => v > 0);
            var historical = orgActuals.Take(lastIdx + 1).ToList();
            var remaining = 12 - historical.Count;

            if (remaining > 0 && historical.Count >= 2)
            {
                try
                {
                    var ep = monthsWithData >= 6 ? "/forecast/moving-average" : "/forecast/trend";
                    trendMethod = monthsWithData >= 6 ? "Weighted Moving Average" : "Linear Trend (OLS)";
                    var payload = new { historical_spending = historical, department = "ALL", fiscal_year = fiscalYear, months_to_forecast = remaining };
                    var tResp = await client.PostAsJsonAsync(ep, payload);
                    if (tResp.IsSuccessStatusCode)
                    {
                        var result = await tResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
                        trendPts = new List<TrendPoint>();
                        foreach (var f in result.GetProperty("forecasts").EnumerateArray())
                        {
                            trendPts.Add(new TrendPoint(
                                f.GetProperty("month_name").GetString() ?? "",
                                f.GetProperty("predicted").GetDouble(),
                                f.GetProperty("upper_bound").GetDouble(),
                                f.GetProperty("lower_bound").GetDouble()));
                        }
                    }
                }
                catch { /* trend is optional */ }
            }
        }

        // ── Build unified chart data (one row per month) ──────────────────────────
        var chartData = Enumerable.Range(1, 12).Select(m =>
        {
            var ms = MonthNames[m - 1];
            var tp = trendPts?.FirstOrDefault(t => t.Month == ms);
            var row = new
            {
                month = ms,
                budget = Math.Round(budgetByMonth[m], 2),
                actual = actualByMonth[m] > 0 ? (double?)Math.Round(actualByMonth[m], 2) : null,
                committed = Math.Round(approvedByMonth[m], 2),
                upperBound = Math.Round(mlUpperByMonth[m], 2),
                lowerBound = Math.Round(mlLowerByMonth[m], 2),
                trendLine = tp != null ? (double?)Math.Round(tp.Predicted, 2) : null,
                trendUpper = tp != null ? (double?)Math.Round(tp.UpperBound, 2) : null,
                trendLower = tp != null ? (double?)Math.Round(tp.LowerBound, 2) : null
            };
            Console.WriteLine($"[CHARTDATA] {ms}: budget={row.budget} | actual={row.actual?.ToString() ?? "null"} | committed={row.committed}");
            return row;
        }).ToList();

        var projectedEOY = approvedByMonth.Skip(1).Sum();
        var totalBudget = budgetByMonth.Skip(1).Sum();
        var varPctOrg = totalBudget > 0 ? (projectedEOY - totalBudget) / totalBudget * 100 : 0;
        var depletionRisk = varPctOrg > 15 ? "High" : varPctOrg > 5 ? "Medium" : "Low";

        var insights = GenerateInsights(deptForecasts);

        return Ok(new
        {
            projectedEOY = Math.Round(projectedEOY, 2),
            totalBudget = Math.Round(totalBudget, 2),
            variancePct = Math.Round(varPctOrg, 2),
            depletionRisk,
            monthsOfData = monthsWithData,
            trendMethod,
            hasEnoughData = monthsWithData >= 3,
            chartData,
            departments = deptForecasts,
            insights
        });
    }

    // ── Hybrid Insight Engine (DB utilization + ML risk, mutually exclusive rules) ──
    private static List<InsightDto> GenerateInsights(List<DeptForecastDto> depts)
    {
        var insights = new List<InsightDto>();

        foreach (var dept in depts)
        {
            if (!dept.MonthlyForecasts.Any()) continue;

            // ── DB utilization: committed funds (sum of approved proposals) vs annual cap ──
            var committedFunds = dept.MonthlyForecasts.Sum(m => m.PredictedSpending);
            var currentUtilizationPct = dept.AnnualBudget > 0
                ? (committedFunds / dept.AnnualBudget) * 100.0
                : 0.0;
            var utilizationDisplay = Math.Round(currentUtilizationPct, 1);

            // ── Dominant ML risk across all months for this dept ──────────────────────
            var mlRisk = dept.MonthlyForecasts.Any(m => m.MlRiskLevel == "High") ? "High"
                       : dept.MonthlyForecasts.Any(m => m.MlRiskLevel == "Medium") ? "Medium"
                       : "Low";

            var modelUsed = dept.MonthlyForecasts
                .Where(m => !string.IsNullOrEmpty(m.MlModelUsed))
                .Select(m => m.MlModelUsed)
                .FirstOrDefault() ?? "ML Model";

            // ── Rule 1 — Critical Overrun (High/Medium ML risk AND >= 75% DB utilization) ─
            if ((mlRisk == "High" || mlRisk == "Medium") && currentUtilizationPct >= 75)
            {
                insights.Add(new InsightDto(
                    "Warning",
                    $"Budget Overrun Risk — {dept.DepartmentName}",
                    $"Live DB data shows {utilizationDisplay}% of funds are already committed. The {modelUsed} model confirms a high probability of exceeding the budget cap by end-of-year.",
                    "Hybrid (DB + ML)"));
            }
            // ── Rule 2 — Late Surge (High/Medium ML risk AND < 75% DB utilization) ──────
            else if ((mlRisk == "High" || mlRisk == "Medium") && currentUtilizationPct < 75)
            {
                insights.Add(new InsightDto(
                    "Caution",
                    $"Hidden Burn Rate — {dept.DepartmentName}",
                    $"Current DB commitments are low ({utilizationDisplay}%), but the {modelUsed} model predicts standard enterprise utilization by EOY. Do not reallocate funds prematurely.",
                    "Hybrid (DB + ML)"));
            }
            // ── Rule 3 — Safe Reallocation (Low ML risk AND < 60% DB utilization) ────────
            else if (mlRisk == "Low" && currentUtilizationPct < 60)
            {
                var safeToMove = Math.Round(dept.AnnualBudget * (1.0 - currentUtilizationPct / 100.0) * 0.5);
                insights.Add(new InsightDto(
                    "Opportunity",
                    $"Safe Reallocation — {dept.DepartmentName}",
                    $"Both live DB activity and the {modelUsed} model project a stable surplus. Approximately ₱{safeToMove:N0} could be safely reallocated to at-risk departments.",
                    "Hybrid (DB + ML)"));
            }
        }

        return insights.Take(4).ToList();
    }

    private static object BuildEmptyResponse() => new
    {
        projectedEOY = 0.0,
        totalBudget = 0.0,
        variancePct = 0.0,
        depletionRisk = "Low",
        monthsOfData = 0,
        trendMethod = "none",
        hasEnoughData = false,
        chartData = new List<object>(),
        departments = new List<object>(),
        insights = new List<object>()
    };

    private static Dictionary<int, double> BuildMonthlyTotals(
        IEnumerable<(string? PlannedMonth, DateTime? FallbackDate, double Amount)> items)
    {
        var result = new Dictionary<int, double>();
        foreach (var item in items)
        {
            var monthIndex = ResolveMonthIndex(item.PlannedMonth, item.FallbackDate);
            if (monthIndex is < 1 or > 12) continue;
            var month = monthIndex.GetValueOrDefault();
            if (!result.ContainsKey(month)) result[month] = 0;
            result[month] += item.Amount;
        }
        return result;
    }

    private static int? ResolveMonthIndex(string? monthText, DateTime? fallbackDate = null)
    {
        if (!string.IsNullOrWhiteSpace(monthText))
        {
            var normalized = monthText.Trim().ToUpperInvariant();

            // Handle numeric months if entered as strings
            if (int.TryParse(normalized, out var m) && m >= 1 && m <= 12) return m;

            // Handle full names or 3-letter abbreviations
            var fullMonthNames = new[] { "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER" };

            for (int i = 0; i < 12; i++)
            {
                if (normalized == MonthNames[i] || normalized == fullMonthNames[i] || (normalized.Length >= 3 && normalized.StartsWith(MonthNames[i])))
                {
                    return i + 1;
                }
            }
        }
        return fallbackDate?.Month;
    }

    record TrendPoint(string Month, double Predicted, double UpperBound, double LowerBound);
}
