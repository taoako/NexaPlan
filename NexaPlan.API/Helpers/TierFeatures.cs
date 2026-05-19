namespace NexaPlan.API.Helpers;

public static class TierFeatures
{
    private static bool IsTier(string tier, string target) => 
        string.Equals(tier, target, StringComparison.OrdinalIgnoreCase);

    // ── ML & Forecasting ────────────────────────────────────────────────────
    public static bool CanUseMLPrediction(string tier) =>
        IsTier(tier, "Professional") || IsTier(tier, "Enterprise");

    public static bool CanUseConfidenceBands(string tier) =>
        IsTier(tier, "Enterprise");

    public static bool CanUseAnomalyDetection(string tier) =>
        IsTier(tier, "Enterprise");

    // ── Scenario Planning ───────────────────────────────────────────────────
    public static bool CanUseScenarios(string tier) =>
        IsTier(tier, "Professional") || IsTier(tier, "Enterprise");

    public static int MaxScenarios(string tier)
    {
        if (IsTier(tier, "Professional")) return 5;
        if (IsTier(tier, "Enterprise")) return int.MaxValue;
        return 0;
    }

    // ── Departments ─────────────────────────────────────────────────────────
    public static int MaxDepartments(string tier)
    {
        if (IsTier(tier, "Starter")) return 5;
        if (IsTier(tier, "Professional")) return int.MaxValue;
        if (IsTier(tier, "Enterprise")) return int.MaxValue;
        if (IsTier(tier, "Trial")) return 3;
        return 3;
    }

    // ── Users (Finance Manager + Dept Head seats combined) ──────────────────
    public static int MaxUsers(string tier)
    {
        if (IsTier(tier, "Starter")) return 3;
        if (IsTier(tier, "Professional")) return 15;
        if (IsTier(tier, "Enterprise")) return int.MaxValue;
        if (IsTier(tier, "Trial")) return 10;
        return 3;
    }

    // ── Historical Data Range ───────────────────────────────────────────────
    public static int HistoryMonths(string tier)
    {
        if (IsTier(tier, "Starter")) return 12;
        if (IsTier(tier, "Professional")) return 24;
        if (IsTier(tier, "Enterprise")) return 1200; // unlimited
        if (IsTier(tier, "Trial")) return 12;
        return 12;
    }

    // ── Variance Analysis ───────────────────────────────────────────────────
    public static bool CanSeeMLVarianceColumn(string tier) =>
        IsTier(tier, "Professional") || IsTier(tier, "Enterprise");

    // ── Scenario Pitching ───────────────────────────────────────────────────
    public static bool CanSubmitScenarioPitch(string tier) =>
        IsTier(tier, "Professional") || IsTier(tier, "Enterprise");

    // ── Helper: build the features object returned to the frontend ──────────
    public static object BuildFeaturesPayload(string tier) => new
    {
        currentTier           = tier,
        canUseMLPrediction    = CanUseMLPrediction(tier),
        canUseConfidenceBands = CanUseConfidenceBands(tier),
        canUseAnomalyDetection= CanUseAnomalyDetection(tier),
        canUseScenarios       = CanUseScenarios(tier),
        canSubmitPitch        = CanSubmitScenarioPitch(tier),
        canSeeMLVarianceCol   = CanSeeMLVarianceColumn(tier),
        maxScenarios          = MaxScenarios(tier),
        maxDepartments        = MaxDepartments(tier),
        maxUsers              = MaxUsers(tier),
        historyMonths         = HistoryMonths(tier),
    };
}
