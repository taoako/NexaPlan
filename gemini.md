I have a FastAPI ML microservice at NexaPlan.API/ml_service/main.py that serves budget spending predictions for a .NET system. I need you to revamp it to use a HYBRID model setup.

CONTEXT:
- I have TWO trained sklearn Pipeline .pkl files in the ml_service/ folder:
  - nexaplan_rf_model (2).pkl  (Random Forest — best accuracy WITHIN training range)
  - nexaplan_ridge_model.pkl (Ridge Regression — extrapolates BEYOND training range)
- Both models were trained on log1p(Actual_Spending) as the target
- Both accept inputs: Budgeted_Amount (float), Department (string), Month (string, 3-letter e.g. "JAN")
- TRAINING_MAX = 19985.0 (the max budget in the training dataset)
- The RF model cannot predict correctly for budgets above TRAINING_MAX — it just returns the same capped value
- The Ridge model is linear so it extrapolates correctly for large budgets

WHAT I NEED YOU TO DO:
1. Load BOTH .pkl files at FastAPI startup (rf_model and ridge_model)
2. Revamp the /predict endpoint to use a HYBRID routing rule:
   - If Budgeted_Amount <= 19985 → use rf_model (Random Forest)
   - If Budgeted_Amount > 19985  → use ridge_model (Ridge Regression)
3. Both models output a log-space prediction — convert back with np.expm1()
4. The /predict response must include these fields (keep all existing fields, just add the two new ones):
   - predicted_spending (float)
   - variance_amount (float)
   - variance_pct (float)
   - risk_level ("Low" / "Medium" / "High") based on utilization %:
       utilization = predicted_spending / Budgeted_Amount * 100
       >= 110% → High, >= 90% → Medium, else → Low
   - model_used (string: "RandomForest" or "Ridge")
   - confidence_note (string: explain which model was used and why)
5. Keep ALL existing endpoints untouched (/forecast/trend, /forecast/moving-average, /health, etc.) — only modify the model loading and /predict logic
6. Keep the existing Pydantic request model and all imports — just add joblib loads for both models and update the /predict function

Do not remove any existing logic. Only add the hybrid routing to /predict and load both pkl files at startup. read the aicontext for more context of my system and then update it after this session okay