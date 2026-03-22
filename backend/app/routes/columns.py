from fastapi import APIRouter, HTTPException
import joblib
import os

router = APIRouter()

COLUMNS_PATH = "artifacts/columns.pkl"
META_PATH = "artifacts/meta.pkl"


@router.get("/columns/")
def get_columns():
    try:
        # -----------------------------
        # CHECK ONLY REQUIRED FILE
        # -----------------------------
        if not os.path.exists(COLUMNS_PATH):
            raise HTTPException(status_code=400, detail="Model not trained")

        # -----------------------------
        # LOAD COLUMNS
        # -----------------------------
        columns = joblib.load(COLUMNS_PATH)

        # -----------------------------
        # LOAD META (SAFE)
        # -----------------------------
        target = None
        problem_type = "unknown"

        if os.path.exists(META_PATH):
            try:
                meta = joblib.load(META_PATH)
                target = meta.get("target")
                problem_type = meta.get("problem_type", "unknown")
            except Exception as meta_error:
                print("⚠️ META LOAD ERROR:", meta_error)

        # -----------------------------
        # RESPONSE
        # -----------------------------
        return {
            "status": "success",
            "columns": columns,
            "target": target,
            "problem_type": problem_type
        }

    except HTTPException:
        raise

    except Exception as e:
        print("🔥 COLUMNS ERROR:", e)
        raise HTTPException(status_code=500, detail="Failed to load columns")