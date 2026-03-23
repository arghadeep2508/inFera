from fastapi import APIRouter, HTTPException, Query, Request
import pandas as pd
import os
import math

router = APIRouter()

# 🔥 FIXED PATH (works locally + Railway)
DATA_PATH = "/app/artifacts/data.csv"

# 🔥 CONFIG
DEFAULT_PREVIEW_ROWS = 20
MAX_PREVIEW_ROWS = 50


# -----------------------------
# 🔥 SAFE FLOAT CONVERTER
# -----------------------------
def safe_float(x):
    try:
        if x is None or (isinstance(x, float) and math.isnan(x)):
            return 0.0
        return float(x)
    except:
        return 0.0


# -----------------------------
# 🔥 SAFE DATA LOADER
# -----------------------------
def get_df(request: Request):
    # 1. Try memory first
    if hasattr(request.app.state, "df") and request.app.state.df is not None:
        return request.app.state.df

    # 2. Fallback to file
    if os.path.exists(DATA_PATH):
        return pd.read_csv(DATA_PATH)

    return None


@router.get("/visualize/")
def visualize(request: Request, limit: int = Query(DEFAULT_PREVIEW_ROWS)):
    try:
        # -----------------------------
        # LOAD DATASET
        # -----------------------------
        df = get_df(request)

        if df is None:
            raise HTTPException(status_code=400, detail="No dataset uploaded")

        if df.empty:
            raise HTTPException(status_code=400, detail="Dataset is empty")

        # -----------------------------
        # CLEAN COLUMN NAMES
        # -----------------------------
        df.columns = [str(col).strip() for col in df.columns]

        # -----------------------------
        # LIMIT CONTROL
        # -----------------------------
        if limit > MAX_PREVIEW_ROWS:
            limit = MAX_PREVIEW_ROWS

        if limit <= 0:
            limit = DEFAULT_PREVIEW_ROWS

        # -----------------------------
        # AUTO DETECT TYPES (FIXED)
        # -----------------------------
        numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

        # -----------------------------
        # SUMMARY STATS (SAFE)
        # -----------------------------
        summary = {}

        if numeric_cols:
            desc = df[numeric_cols].describe()

            for col in numeric_cols:
                summary[col] = {
                    "mean": safe_float(desc[col].get("mean")),
                    "min": safe_float(desc[col].get("min")),
                    "max": safe_float(desc[col].get("max")),
                    "std": safe_float(desc[col].get("std")),
                }

        # -----------------------------
        # CATEGORY ANALYSIS
        # -----------------------------
        category_analysis = {}

        for col in categorical_cols[:5]:
            try:
                category_analysis[col] = (
                    df[col]
                    .astype(str)
                    .value_counts()
                    .head(5)
                    .to_dict()
                )
            except:
                category_analysis[col] = {}

        # -----------------------------
        # CORRELATION (SAFE)
        # -----------------------------
        correlation = {}

        if len(numeric_cols) >= 2:
            try:
                corr_df = df[numeric_cols].corr()

                correlation = {
                    col: {k: safe_float(v) for k, v in corr_df[col].items()}
                    for col in corr_df.columns
                }
            except:
                correlation = {}

        # -----------------------------
        # PREVIEW DATA (SAFE)
        # -----------------------------
        preview_df = df.head(limit).copy()

        preview = preview_df.where(pd.notnull(preview_df), None).to_dict(orient="records")

        # -----------------------------
        # RESPONSE
        # -----------------------------
        return {
            "status": "success",
            "rows": int(df.shape[0]),
            "columns": int(df.shape[1]),

            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,

            "summary": summary,
            "category_analysis": category_analysis,
            "correlation": correlation,

            "preview": preview,
            "preview_count": int(limit),
        }

    except Exception as e:
        print("🔥 VISUALIZE ERROR:", str(e))  # 🔥 REAL DEBUG
        raise HTTPException(status_code=500, detail=str(e))
