from fastapi import APIRouter
import pandas as pd
import os

from app.services.ai import generate_ai_insights

router = APIRouter()

DATA_PATH = "artifacts/data.csv"


@router.get("/ai-insights/")
def ai_insights():
    try:
        if not os.path.exists(DATA_PATH):
            return {"error": "No dataset found"}

        df = pd.read_csv(DATA_PATH)

        summary = df.describe(include="all").to_dict()
        missing = df.isnull().sum().to_dict()
        columns = df.columns.tolist()

        insights = generate_ai_insights(summary, missing, columns)

        return {
            "status": "success",
            "insights": insights
        }

    except Exception as e:
        return {"error": str(e)}