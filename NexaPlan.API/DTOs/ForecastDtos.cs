namespace NexaPlan.API.DTOs;

public record MlPredictRequest(
    double budgeted_amount,
    string department,
    string month);

public record MlPredictResponse(
    double predicted_spending,
    double variance_amount,
    double variance_pct,
    string risk_level);

public record MonthForecastDto(
    string Month,
    double BudgetedAmount,
    double PredictedSpending,
    double VariancePct,
    string RiskLevel);

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

public record ForecastSummaryDto(
    double ProjectedEOY,
    double TotalAnnualBudget,
    double VariancePct,
    string DepletionRisk,
    double ModelAccuracy,
    List<DeptForecastDto> Departments,
    List<InsightDto> Insights);
