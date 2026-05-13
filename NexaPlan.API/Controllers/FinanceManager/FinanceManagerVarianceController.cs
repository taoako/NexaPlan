using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using NexaPlan.API.DTOs;

namespace NexaPlan.API.Controllers.FinanceManager;

[ApiController]
[Route("api/finance-manager/variance")]
public class FinanceManagerVarianceController : FinanceManagerBaseController
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _http;
    private const string ML_URL = "http://localhost:8001";

    private static readonly string[] MonthOrder =
        { "JAN","FEB","MAR","APR","MAY","JUN",
          "JUL","AUG","SEP","OCT","NOV","DEC" };

    public FinanceManagerVarianceController(AppDbContext db, IHttpClientFactory http) : base(db)
    {
        _db  = db;
        _http = http;
    }

    // GET /api/finance-manager/variance?fiscalYear=2026&month=MAR
    // month is optional — omit for full year view
    [HttpGet]
    public async Task<IActionResult> GetVariance(
        [FromQuery] int    fiscalYear = 2026,
        [FromQuery] string? month     = null)
    {
        var tenantId     = GetTenantId();
        var filterMonth  = month?.ToUpper().Trim();
        if (filterMonth != null && filterMonth.Length >= 3) filterMonth = filterMonth[..3];

        var departments = await _db.Departments
            .Where(d => d.TenantID == tenantId)
            .ToListAsync();

        var deptIds = departments.Select(d => d.DepartmentID).ToList();

        // Load allocations for budget cap reference
        var allocations = await _db.DepartmentAllocations
            .Where(a => a.FiscalYear == fiscalYear
                     && deptIds.Contains(a.DepartmentID))
            .ToListAsync();

        // Load approved proposals with planned months
        var proposalsQuery = _db.BudgetProposals
            .Where(p => deptIds.Contains(p.DepartmentID)
                     && p.TenantID == tenantId
                     && p.ProposalStatus == "Approved"
                     && (p.PlannedYear ?? (p.FiscalYear > 0 ? p.FiscalYear : p.SubmittedAt.Year)) == fiscalYear);

        var proposalsRaw = await proposalsQuery
            .Select(p => new
            {
                p.DepartmentID,
                p.PlannedMonth,
                p.SubmittedAt,
                Amount = p.RequestedAmount > 0 ? p.RequestedAmount : p.TotalAmount
            })
            .ToListAsync();

        var proposals = proposalsRaw
            .Select(p => new
            {
                p.DepartmentID,
                Month = ResolveMonthLabel(p.PlannedMonth, p.SubmittedAt),
                Amount = p.Amount
            })
            .Where(p => p.Month != null)
            .Where(p => filterMonth == null || p.Month == filterMonth)
            .Select(p => new ProposalPoint(p.DepartmentID, p.Month!, p.Amount))
            .ToList();

        // Load reconciled expenses using expense date first (authoritative),
        // with legacy fallback to reconciled/submitted timestamps.
        var expensesRaw = await _db.Expenses
            .Where(e => e.Status == "Reconciled"
                     && e.TenantID == tenantId
                     && deptIds.Contains(e.DepartmentID))
            .Select(e => new
            {
                e.DepartmentID,
                e.Amount,
                e.ExpenseDate,
                e.ReconciledAt,
                e.SubmittedAt
            })
            .ToListAsync();

        var expenses = expensesRaw
            .Select(e =>
            {
                var effectiveDate = e.ExpenseDate ?? e.ReconciledAt ?? e.SubmittedAt;
                return new ExpensePoint(
                    e.DepartmentID,
                    e.Amount,
                    MonthOrder[effectiveDate.Month - 1],
                    effectiveDate.Year);
            })
            .Where(e => e.Year == fiscalYear)
            .Where(e => filterMonth == null || e.Month == filterMonth)
            .ToList();

        var results = new List<DeptVarianceDto>();
        var client  = _http.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(4);

        foreach (var dept in departments)
        {
            var cap = allocations
                .FirstOrDefault(a => a.DepartmentID == dept.DepartmentID)
                ?.TotalAllocatedCap ?? dept.AnnualBudgetCap;

            // Planned budget = sum of approved proposals for this period
            var plannedBudget = proposals
                .Where(p => p.DepartmentID == dept.DepartmentID)
                .Sum(p => p.Amount);

            // Actual spend = sum of reconciled expenses for this period
            var actualSpent = expenses
                .Where(e => e.DepartmentID == dept.DepartmentID)
                .Sum(e => e.Amount);

            // If no proposals with planned months exist, fall back to
            // proportional cap (full year = cap, single month = cap ÷ 12)
            var budgetReference = plannedBudget > 0
                ? plannedBudget
                : (filterMonth != null ? cap / 12 : cap);

            var variance    = budgetReference - actualSpent; // Adjusted the logic to budget - actual, because positive variance usually means under budget
            var variancePct = budgetReference > 0
                ? (double)(variance / budgetReference * 100) : 0;

            // Monthly breakdown — only meaningful for full-year view
            var monthlyBreakdown = filterMonth == null
                ? BuildMonthlyBreakdown(dept.DepartmentID, fiscalYear,
                    proposals, expenses)
                : new List<MonthlyVarianceDto>();

            // ML: get expected YTD spending for this dept+period
            double mlExpected;
            bool   isAnomaly;
            string mlNote;
            string mlModel;

            if (filterMonth == null)
            {
                // Full Year view: sum ML predictions for every elapsed month so far
                // to get a true YTD expected spend (comparable to accumulated ActualSpent).
                var currentMonth = DateTime.Now.Year == fiscalYear ? DateTime.Now.Month : 12;
                var monthlyBudgetProbe = (double)(cap / 12);
                var ytdMlTotal = 0.0;
                string lastNote = "";
                string lastModel = "";

                for (int mi = 1; mi <= currentMonth; mi++)
                {
                    var mStr = MonthOrder[mi - 1];
                    var (mExp, _, mNote, mMod) = await GetMlExpected(
                        client, dept.DepartmentName, mStr, monthlyBudgetProbe, 0);
                    ytdMlTotal += mExp;
                    if (!string.IsNullOrEmpty(mNote))  lastNote  = mNote;
                    if (!string.IsNullOrEmpty(mMod))   lastModel = mMod;
                }

                mlExpected = Math.Round(ytdMlTotal, 2);
                isAnomaly  = actualSpent > 0 && mlExpected > 0
                             && ((double)actualSpent - mlExpected) / mlExpected * 100 > 20;
                mlNote     = lastNote;
                mlModel    = lastModel;
            }
            else
            {
                // Single month view: single ML call, compare to that month's actual.
                var budgetProbe = (double)(budgetReference > 0 ? budgetReference : cap / 12);
                (mlExpected, isAnomaly, mlNote, mlModel) =
                    await GetMlExpected(client, dept.DepartmentName, filterMonth, budgetProbe, (double)actualSpent);
            }


            results.Add(new DeptVarianceDto(
                dept.DepartmentID,
                dept.DepartmentName,
                Math.Round((double)budgetReference, 2),
                Math.Round((double)actualSpent, 2),
                Math.Round((double)variance, 2),
                Math.Round(variancePct, 2),
                variance < 0 ? "Over" : "Under",
                monthlyBreakdown,
                mlExpected,
                isAnomaly,
                mlModel,
                mlNote));
        }

        var summary = new VarianceSummaryDto(
            fiscalYear,
            filterMonth ?? "ALL",
            results.Sum(r => r.BudgetedAmount),
            results.Sum(r => r.ActualSpent),
            results.Sum(r => r.VarianceAmount),
            results);

        return Ok(summary);
    }

    // ── ML: fetch expected spending for a dept+month from RF model ────────────
    private async Task<(double MlExpected, bool IsAnomaly, string MlNote, string MlModel)> GetMlExpected(
        HttpClient client, string deptName, string month, double budgetRef, double actualSpent)
    {
        try
        {
            if (budgetRef <= 0) return (0, false, "", "");
            var payload  = new { budgeted_amount = budgetRef, department = deptName, month };
            var response = await client.PostAsJsonAsync($"{ML_URL}/predict", payload);
            if (!response.IsSuccessStatusCode) return (0, false, "", "");
            var pred = await response.Content.ReadFromJsonAsync<MlPredictResponse>();
            if (pred == null) return (0, false, "", "");
            
            var mlExp = pred.predicted_spending;
            // Anomaly: actual is > 20% above what ML expected
            var isAnomaly = actualSpent > 0 && mlExp > 0 && ((actualSpent - mlExp) / mlExp * 100) > 20;
            return (Math.Round(mlExp, 2), isAnomaly, pred.confidence_note, pred.model_used);
        }
        catch { return (0, false, "", ""); }
    }

    private static List<MonthlyVarianceDto> BuildMonthlyBreakdown(
        int deptId,
        int fiscalYear,
        List<ProposalPoint> proposals,
        List<ExpensePoint> expenses)
    {
        var breakdown = new List<MonthlyVarianceDto>();

        foreach (var month in MonthOrder)
        {
            var planned = proposals
                .Where(p => p.DepartmentID == deptId
                         && p.Month == month)
                .Sum(p => (decimal)p.Amount);

            var actual = expenses
                .Where(e => e.DepartmentID == deptId
                          && e.Month == month)
                .Sum(e => (decimal)e.Amount);

            var variance = planned - actual;

            breakdown.Add(new MonthlyVarianceDto(
                month,
                Math.Round((double)planned, 2),
                Math.Round((double)actual, 2),
                Math.Round((double)variance, 2),
                planned > 0
                    ? Math.Round((double)(variance / planned * 100), 2)
                    : 0));
        }

        return breakdown;
    }

    private static string? ResolveMonthLabel(string? monthText, DateTime submittedAt)
    {
        if (!string.IsNullOrWhiteSpace(monthText))
        {
            var normalized = monthText.Trim().ToUpperInvariant();
            
            // Handle numeric months if entered as strings
            if (int.TryParse(normalized, out var m) && m >= 1 && m <= 12) return MonthOrder[m - 1];

            // Handle full names or 3-letter abbreviations
            var fullMonthNames = new[] { "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER" };
            
            for (int i = 0; i < 12; i++)
            {
                if (normalized == MonthOrder[i] || normalized == fullMonthNames[i] || (normalized.Length >= 3 && normalized.StartsWith(MonthOrder[i])))
                {
                    return MonthOrder[i];
                }
            }
        }
        return MonthOrder[submittedAt.Month - 1];
    }

    private record ProposalPoint(int DepartmentID, string Month, decimal Amount);
    private record ExpensePoint(int DepartmentID, decimal Amount, string Month, int Year);
}

public record MonthlyVarianceDto(
    string Month,
    double BudgetedAmount,
    double ActualSpent,
    double VarianceAmount,
    double VariancePct);

public record DeptVarianceDto(
    int    DepartmentId,
    string DepartmentName,
    double BudgetedAmount,
    double ActualSpent,
    double VarianceAmount,
    double VariancePct,
    string Status,
    List<MonthlyVarianceDto> MonthlyBreakdown,
    double MlExpectedSpending,   // RF model's predicted spending for this period
    bool   IsAnomaly,            // actual >> ML expected → flag for investigation
    string MlModelUsed,
    string MlConfidenceNote);

public record VarianceSummaryDto(
    int    FiscalYear,
    string SelectedMonth,    // "ALL" or "JAN"-"DEC"
    double TotalBudgeted,
    double TotalActual,
    double TotalVariance,
    List<DeptVarianceDto> Departments);
