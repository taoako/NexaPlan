namespace NexaPlan.API.DTOs;

// ── ML Service contracts ──────────────────────────────────────────────────────
public record MlPredictRequest(
    double budgeted_amount,
    string department,
    string month);

public record MlPredictResponse(
    double predicted_spending,
    double variance_amount,
    double variance_pct,
    string risk_level,
    double upper_bound,
    double lower_bound,
    string model_used,
    string confidence_note);

// ── Analytics / Forecasting DTOs ─────────────────────────────────────────────

/// <summary>
/// Per-month entry for a department.
/// PredictedSpending = sum of approved proposals for that month (committed, deterministic).
/// MlPredictedSpending = RF model's predicted utilisation for that budget level.
/// MlRiskLevel = Low / Medium / High from RF model.
/// </summary>
public record MonthForecastDto(
    string Month,
    double BudgetedAmount,
    double ActualSpent,
    double PredictedSpending,   // Approved proposals for the month (committed)
    double VariancePct,         // (committed - budget) / budget * 100
    string RiskLevel,           // Deterministic risk from committed variance
    double MlPredictedSpending, // RF model prediction (spending utilisation signal)
    string MlRiskLevel,         // RF model risk level
    double MlUpperBound,
    double MlLowerBound,
    string MlModelUsed,
    string MlConfidenceNote);

public record DeptForecastDto(
    int    DepartmentId,
    string DepartmentName,
    double AnnualBudget,
    double ActualSpent,
    List<MonthForecastDto> MonthlyForecasts);

public record InsightDto(
    string Type,
    string Title,
    string Description,
    string Confidence);

/// <summary>
/// Used for chart month data point returned in chartData[].
/// </summary>
public record ChartMonthDto(
    string  Month,
    double  Budget,
    double? Actual,          // null if no reconciled expenses yet for that month
    double  Committed,       // approved proposals
    double  UpperBound,      // committed + pending (worst case)
    double  LowerBound,      // committed only (best case)
    double? TrendLine,       // linear/WMA forecast from Python
    double? TrendUpper,
    double? TrendLower);
