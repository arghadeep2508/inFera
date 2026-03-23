from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os

router = APIRouter()

MODEL_PATH = "artifacts/model.pkl"
COLUMNS_PATH = "artifacts/columns.pkl"
DATA_PATH = "artifacts/data.csv"


class ForecastRequest(BaseModel):
    data: dict
    years_ahead: int


# -----------------------------
# LOAD MODEL
# -----------------------------
def load_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(COLUMNS_PATH):
        return None, None

    model = joblib.load(MODEL_PATH)
    columns = joblib.load(COLUMNS_PATH)

    return model, columns


# -----------------------------
# SAFE CONVERSION (🔥 FIX)
# -----------------------------
def safe_float(val):
    try:
        if val is None or val == "":
            return np.nan
        return float(val)
    except:
        return np.nan


# -----------------------------
# GET PREVIOUS VALUE
# -----------------------------
def get_prev_access(country, year):
    if not os.path.exists(DATA_PATH):
        return None

    df = pd.read_csv(DATA_PATH)

    if "Country_Name" not in df.columns or "Year" not in df.columns:
        return None

    df = df.sort_values(by=["Country_Name", "Year"])

    prev_row = df[
        (df["Country_Name"] == country) &
        (df["Year"] == year - 1)
    ]

    if prev_row.empty:
        return None

    target = df.columns[-1]

    return float(prev_row.iloc[-1][target])


# -----------------------------
# FORECAST API
# -----------------------------
@router.post("/forecast/")
def forecast(request: ForecastRequest):

    model, columns = load_model()

    if model is None or columns is None:
        raise HTTPException(status_code=400, detail="Model not trained")

    try:
        input_data = request.data.copy()
        years_ahead = request.years_ahead

        # 🔥 SAFE EXTRACTION
        country = input_data.get("Country_Name")

        year_raw = input_data.get("Year")
        if year_raw is None or year_raw == "":
            raise HTTPException(status_code=400, detail="Year is required")

        year = int(float(year_raw))

        prev_access = get_prev_access(country, year)

        if prev_access is None:
            raise HTTPException(
                status_code=400,
                detail="No previous data available for forecasting"
            )

        results = {}

        # -----------------------------
        # FORECAST LOOP
        # -----------------------------
        for i in range(years_ahead):

            current_year = year + i

            temp_input = input_data.copy()
            temp_input["Year"] = current_year
            temp_input["prev_access"] = prev_access

            # -----------------------------
            # ALIGN INPUT (🔥 FIXED SAFE)
            # -----------------------------
            processed_input = {}

            for col in columns:
                val = temp_input.get(col, np.nan)
                processed_input[col] = safe_float(val)

            df = pd.DataFrame([processed_input])
            df = df.reindex(columns=columns)

            # 🔥 HANDLE NaNs (IMPORTANT)
            df = df.fillna(0)

            # -----------------------------
            # PREDICTION
            # -----------------------------
            pred = model.predict(df)[0]
            pred = float(pred)

            results[str(current_year)] = round(pred, 2)

            # 🔥 FEEDBACK LOOP (VERY GOOD DESIGN)
            prev_access = pred

        return {
            "status": "success",
            "forecast": results
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("🔥 FORECAST ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
