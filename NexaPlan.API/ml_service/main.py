from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib, numpy as np, pandas as pd, os, requests
from typing import List, Optional

app = FastAPI(title="NexaPlan Forecast Engine")

# ── Hybrid Model Setup ────────────────────────────────────────────────────────
# RF model:    best accuracy for USD budgets within training range (5000–19000)
# Ridge model: linear extrapolation for budgets outside training range
MODEL_DIR   = os.path.dirname(__file__)
rf_pipeline  = joblib.load(os.path.join(MODEL_DIR, "nexaplan_rf_model (2).pkl"))
ridge_pipeline = joblib.load(os.path.join(MODEL_DIR, "nexaplan_ridge_model (1).pkl"))

# Routing thresholds (in USD — the currency the models were trained on)
RF_RANGE_MIN = 5_000.0
RF_RANGE_MAX = 19_000.0

# ── Live Exchange Rate Helper ────────────────────────────────────────────────
FALLBACK_RATE = 58.0  # PHP per 1 USD — used when the live API is unreachable

def get_usd_to_php_rate() -> float:
    """Fetch the real-time USD → PHP exchange rate.
    Falls back to FALLBACK_RATE if the request fails or times out.
    Critical for defense day reliability — never raises an exception.
    """
    try:
        resp = requests.get(
            "https://open.er-api.com/v6/latest/USD",
            timeout=4
        )
        resp.raise_for_status()
        rate = resp.json()["rates"]["PHP"]
        return float(rate)
    except Exception:
        return FALLBACK_RATE

# --- REAL HISTORICAL VOLATILITY (From EDA Notebook) ---
DEPT_VOLATILITY = {
    'FINANCE': 0.363, 'HR': 0.384, 'IT': 0.366, 
    'MARKETING': 0.386, 'OPERATIONS': 0.363, 'SALES': 0.362
}
MONTH_RISK = {
    'APR': 0.361, 'AUG': 0.368, 'DEC': 0.37, 'FEB': 0.368, 
    'JAN': 0.389, 'JUL': 0.374, 'JUN': 0.365, 'MAR': 0.379, 
    'MAY': 0.373, 'NOV': 0.377, 'OCT': 0.382, 'SEP': 0.338
}


class PredictRequest(BaseModel):
    budgeted_amount: float
    department:      str
    month:           str


class PredictResponse(BaseModel):
    predicted_spending: float
    variance_amount:    float
    variance_pct:       float
    risk_level:         str
    upper_bound:        float
    lower_bound:        float
    model_used:         str
    confidence_note:    str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": [
            "Hybrid: Random Forest (USD 5000–19000) + Ridge Regression (outside range)",
            "Live PHP/USD currency serialization via open.er-api.com (fallback: 58.0)"
        ],
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    dept   = req.department.upper().strip()
    month  = req.month.upper().strip()[:3]
    budget = req.budgeted_amount

    if budget <= 0:
        raise HTTPException(status_code=422, detail="budgeted_amount must be > 0")

    # ── Step 1: Fetch live exchange rate & convert PHP → USD ─────────────────
    php_rate   = get_usd_to_php_rate()          # PHP per 1 USD
    budget_usd = budget / php_rate              # incoming PHP → USD for model

    try:
        row = pd.DataFrame([{
            "Budgeted_Amount": budget_usd,      # models trained on USD values
            "Department":      dept,
            "Month":           month
        }])

        # ── Step 2: Hybrid routing on USD budget ─────────────────────────────
        if RF_RANGE_MIN <= budget_usd <= RF_RANGE_MAX:
            log_pred   = rf_pipeline.predict(row)[0]
            predicted_usd = float(np.expm1(log_pred))
            model_name = "Random Forest"
            note = (
                f"Random Forest selected: budget ₱{budget:,.2f} = "
                f"${budget_usd:,.2f} USD is within training range "
                f"(${RF_RANGE_MIN:,.0f}–${RF_RANGE_MAX:,.0f}). "
                f"Rate: ₱{php_rate:.4f}/USD."
            )
        else:
            # Ridge model (1).pkl outputs raw dollars, no expm1 needed
            raw_pred   = ridge_pipeline.predict(row)[0]
            predicted_usd = float(raw_pred)
            model_name = "Ridge Regression"
            note = (
                f"Ridge Regression selected: budget ₱{budget:,.2f} = "
                f"${budget_usd:,.2f} USD is outside RF training range "
                f"(${RF_RANGE_MIN:,.0f}–${RF_RANGE_MAX:,.0f}). "
                f"Rate: ₱{php_rate:.4f}/USD."
            )

        # ── Step 3: Convert predicted USD back to PHP ────────────────────────
        predicted = round(predicted_usd * php_rate, 2)  # → PHP

        # ── Step 4: Confidence bands (authentic volatility, in PHP) ──────────
        vol      = DEPT_VOLATILITY.get(dept, 0.36)
        risk_mul = MONTH_RISK.get(month, 0.36)
        sigma    = vol * risk_mul

        upper_bound = predicted * (1 + sigma)
        lower_bound = predicted * (1 - sigma)

    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    variance_amt = predicted - budget
    variance_pct = (variance_amt / budget) * 100

    # ── Step 5: Risk classification (relaxed thresholds for currency-converted data) ─
    if predicted >= (budget * 1.05):
        # High Risk: mathematically projected to go 5%+ over budget
        risk = "High"
    elif upper_bound >= (budget * 1.15):
        # Medium Risk: worst-case historical volatility band breaches +15% buffer
        risk = "Medium"
    else:
        # Low Risk: normal, stable spending behaviour
        risk = "Low"

    # Console log for every call
    print(
        f"[PREDICT] model={model_name} | dept={dept} | month={month} | "
        f"budget_php={budget:.2f} | budget_usd={budget_usd:.2f} | "
        f"predicted_php={predicted:.2f} | rate={php_rate:.4f} | risk={risk}"
    )

    return PredictResponse(
        predicted_spending = predicted,
        variance_amount    = round(variance_amt, 2),
        variance_pct       = round(variance_pct, 2),
        risk_level         = risk,
        upper_bound        = round(upper_bound, 2),
        lower_bound        = round(max(lower_bound, 0), 2),
        model_used         = model_name,
        confidence_note    = note
    )


# ─── Time-Series Forecasting Endpoints ───────────────────────────────────────

MONTH_NAMES = ["JAN","FEB","MAR","APR","MAY","JUN",
               "JUL","AUG","SEP","OCT","NOV","DEC"]


class MonthForecastPoint(BaseModel):
    month_index:  int
    month_name:   str
    predicted:    float
    upper_bound:  float
    lower_bound:  float


class TrendForecastRequest(BaseModel):
    historical_spending: List[float]  # ordered Jan → current month
    department:          str
    fiscal_year:         int = 2026
    months_to_forecast:  int = 6


class TrendForecastResponse(BaseModel):
    department:       str
    method:           str
    months_of_data:   int
    has_enough_data:  bool
    monthly_growth:   float
    forecasts:        List[MonthForecastPoint]
    projected_eoy:    float


@app.post("/forecast/trend", response_model=TrendForecastResponse)
def trend_forecast(req: TrendForecastRequest):
    data = np.array(req.historical_spending, dtype=float)
    n    = len(data)

    if n < 2:
        raise HTTPException(422, "Need at least 2 months of historical data")

    # Fit linear trend: y = slope * x + intercept
    x                = np.arange(n)
    slope, intercept = np.polyfit(x, data, 1)

    # Uncertainty from residuals (1.5σ confidence band)
    predicted_past = slope * x + intercept
    residuals      = data - predicted_past
    uncertainty    = float(np.std(residuals) * 1.5)

    forecasts       = []
    projected_total = 0.0
    start_month_idx = n  # 0-based index of next month

    for i in range(req.months_to_forecast):
        x_future  = n + i
        predicted = float(slope * x_future + intercept)
        predicted = max(predicted, 0)
        month_idx = (start_month_idx + i) % 12

        forecasts.append(MonthForecastPoint(
            month_index = month_idx + 1,
            month_name  = MONTH_NAMES[month_idx],
            predicted   = round(predicted, 2),
            upper_bound = round(predicted + uncertainty, 2),
            lower_bound = round(max(predicted - uncertainty, 0), 2)
        ))
        projected_total += predicted

    return TrendForecastResponse(
        department      = req.department,
        method          = "Linear Trend (OLS)",
        months_of_data  = n,
        has_enough_data = True,
        monthly_growth  = round(float(slope), 2),
        forecasts       = forecasts,
        projected_eoy   = round(projected_total, 2)
    )


@app.post("/forecast/moving-average", response_model=TrendForecastResponse)
def moving_avg_forecast(req: TrendForecastRequest):
    data = req.historical_spending
    n    = len(data)
    if n < 2:
        raise HTTPException(422, "Need at least 2 months of data")

    # Weighted moving average — recent months weighted higher
    weights = np.arange(1, n + 1, dtype=float)
    wma     = float(np.average(data, weights=weights))

    # Trend from last 3 months
    window = min(3, n)
    recent = data[-window:]
    trend  = (recent[-1] - recent[0]) / (len(recent) - 1) if len(recent) >= 2 else 0.0

    uncertainty = float(np.std(data[-min(6, n):]) * 1.2)

    forecasts  = []
    start_idx  = n

    for i in range(req.months_to_forecast):
        predicted = max(wma + trend * (i + 1), 0)
        month_idx = (start_idx + i) % 12

        forecasts.append(MonthForecastPoint(
            month_index = month_idx + 1,
            month_name  = MONTH_NAMES[month_idx],
            predicted   = round(predicted, 2),
            upper_bound = round(predicted + uncertainty, 2),
            lower_bound = round(max(predicted - uncertainty, 0), 2)
        ))

    return TrendForecastResponse(
        department      = req.department,
        method          = "Weighted Moving Average",
        months_of_data  = n,
        has_enough_data = True,
        monthly_growth  = round(trend, 2),
        forecasts       = forecasts,
        projected_eoy   = round(sum(f.predicted for f in forecasts), 2)
    )