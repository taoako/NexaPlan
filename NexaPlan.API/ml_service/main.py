from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib, numpy as np, pandas as pd, os

app = FastAPI(title="NexaPlan Forecast Engine")

MODEL_PATH   = os.path.join(os.path.dirname(__file__), "nexaplan_rf_model.pkl")
pipeline     = joblib.load(MODEL_PATH)
TRAINING_MAX = 19985


class PredictRequest(BaseModel):
    budgeted_amount: float
    department:      str
    month:           str


class PredictResponse(BaseModel):
    predicted_spending: float
    variance_amount:    float
    variance_pct:       float
    risk_level:         str


@app.get("/health")
def health():
    return {
        "status":   "ok",
        "model":    "RandomForestRegressor (Pipeline)",
        "r2_score": 0.8166,
        "mae_log":  0.1426
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    dept   = req.department.upper().strip()
    month  = req.month.upper().strip()[:3]
    budget = req.budgeted_amount

    if budget <= 0:
        raise HTTPException(status_code=422, detail="budgeted_amount must be > 0")

    # Proportional scaling fix: model was trained on budgets up to TRAINING_MAX.
    # We cap the input, get the base prediction, then scale the output back up.
    scale_factor  = budget / TRAINING_MAX
    capped_budget = min(budget, TRAINING_MAX)

    try:
        row = pd.DataFrame([{
            "Budgeted_Amount": capped_budget,
            "Department":      dept,
            "Month":           month
        }])
        log_pred  = pipeline.predict(row)[0]
        base_pred = float(np.expm1(log_pred))   # reverse the log1p training transform
        predicted = round(base_pred * scale_factor, 2)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    variance_amt = predicted - budget
    variance_pct = (variance_amt / budget * 100)
    risk = ("High"   if variance_pct > 15 else
            "Medium" if variance_pct > 5  else "Low")

    return PredictResponse(
        predicted_spending=predicted,
        variance_amount=round(variance_amt, 2),
        variance_pct=round(variance_pct, 2),
        risk_level=risk
    )
