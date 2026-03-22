from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import os

router = APIRouter()

DATA_PATH = "artifacts/data.csv"

# 🔥 CONFIG
DEFAULT_PREVIEW_ROWS = 20
MAX_PREVIEW_ROWS = 50


@router.get("/visualize/")
def visualize(limit: int = Query(DEFAULT_PREVIEW_ROWS)):
    try:
        # -----------------------------
        # CHECK DATASET
        # -----------------------------
        if not os.path.exists(DATA_PATH):
            raise HTTPException(status_code=400, detail="No dataset uploaded")

        df = pd.read_csv(DATA_PATH)

        if df.empty:
            raise HTTPException(status_code=400, detail="Dataset is empty")

        # -----------------------------
        # CLEAN COLUMN NAMES
        # -----------------------------
        df.columns = [col.strip() for col in df.columns]

        # -----------------------------
        # LIMIT CONTROL (🔥 IMPORTANT)
        # -----------------------------
        if limit > MAX_PREVIEW_ROWS:
            limit = MAX_PREVIEW_ROWS

        if limit <= 0:
            limit = DEFAULT_PREVIEW_ROWS

        # -----------------------------
        # AUTO DETECT TYPES
        # -----------------------------
        numeric_cols = df.select_dtypes(include=["int64", "float64"]).columns.tolist()
        categorical_cols = df.select_dtypes(include=["object"]).columns.tolist()

        # -----------------------------
        # SUMMARY STATS (SAFE JSON)
        # -----------------------------
        summary = {}

        if numeric_cols:
            desc = df[numeric_cols].describe()

            for col in numeric_cols:
                summary[col] = {
                    "mean": float(desc[col]["mean"]),
                    "min": float(desc[col]["min"]),
                    "max": float(desc[col]["max"]),
                    "std": float(desc[col]["std"]),
                }

        # -----------------------------
        # CATEGORY ANALYSIS (LIMITED)
        # -----------------------------
        category_analysis = {}

        for col in categorical_cols[:5]:  # limit columns
            category_analysis[col] = (
                df[col]
                .value_counts()
                .head(5)
                .to_dict()
            )

        # -----------------------------
        # CORRELATION (SAFE)
        # -----------------------------
        correlation = {}

        if len(numeric_cols) >= 2:
            corr_df = df[numeric_cols].corr()

            # convert to float (JSON safe)
            correlation = {
                col: {k: float(v) for k, v in corr_df[col].items()}
                for col in corr_df.columns
            }

        # -----------------------------
        # 🔥 PREVIEW DATA (CONTROLLED)
        # -----------------------------
        preview_df = df.head(limit)

        # Convert NaN → None (VERY IMPORTANT for JSON)
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

            # 🔥 NEW FEATURE
            "preview": preview,
            "preview_count": int(limit),
        }

    except Exception as e:
        print("🔥 VISUALIZE ERROR:", e)
        raise HTTPException(status_code=500, detail="Visualization failed")