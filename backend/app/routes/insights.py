from fastapi import APIRouter
import pandas as pd
from app.services.insights import generate_insights

router = APIRouter()

UPLOAD_PATH = "uploaded.csv"


@router.get("/insights/")
def get_insights():
    try:
        df = pd.read_csv(UPLOAD_PATH)
    except Exception:
        return {"error": "No file uploaded yet"}

    insights = generate_insights(df)

    return {"insights": insights}