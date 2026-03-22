from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import os

from app.services.model import train_model

router = APIRouter()

DATA_PATH = "artifacts/data.csv"


@router.post("/train/")
def train(target: str = Query(default=None)):
    try:
        # -----------------------------
        # CHECK DATA EXISTS
        # -----------------------------
        if not os.path.exists(DATA_PATH):
            raise HTTPException(status_code=400, detail="No dataset uploaded")

        df = pd.read_csv(DATA_PATH)

        if df.empty:
            raise HTTPException(status_code=400, detail="Dataset is empty")

        # Clean column names
        df.columns = [col.strip() for col in df.columns]

        # -----------------------------
        # VALIDATE TARGET
        # -----------------------------
        if target:
            target = target.strip()
            if target not in df.columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid target: '{target}'. Available: {list(df.columns)}"
                )

        # -----------------------------
        # TRAIN MODEL (SERVICE)
        # -----------------------------
        result = train_model(df, target)

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        # -----------------------------
        # RESPONSE
        # -----------------------------
        return {
            "status": "success",
            "target": result["target"],
            "problem_type": result["problem_type"],
            "score": result["score"],
            "rows_used": result["rows_used"],
            "features_used": result["features_used"]
        }

    except HTTPException as e:
        raise e

    except Exception as e:
        print("🔥 TRAIN ERROR:", e)
        raise HTTPException(status_code=500, detail="Training failed")