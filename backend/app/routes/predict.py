from fastapi import APIRouter, HTTPException
import joblib
import pandas as pd
import os

router = APIRouter()

MODEL_PATH = "artifacts/model.pkl"
COLUMNS_PATH = "artifacts/columns.pkl"
META_PATH = "artifacts/meta.pkl"


@router.post("/predict/")
def predict(data: dict):
    try:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(status_code=400, detail="Model not trained")

        model = joblib.load(MODEL_PATH)
        columns = joblib.load(COLUMNS_PATH)
        meta = joblib.load(META_PATH)

        input_data = data.get("data", {})

        # 🔥 IMPORTANT: Fill missing columns automatically
        full_input = {}

        for col in columns:
            if col in input_data:
                full_input[col] = input_data[col]
            else:
                full_input[col] = 0  # default fallback

        df = pd.DataFrame([full_input])

        prediction = model.predict(df)[0]

        # Handle classification labels
        if meta["problem_type"] == "classification":
            if meta.get("label_encoder"):
                prediction = meta["label_encoder"].inverse_transform([prediction])[0]

        return {
            "status": "success",
            "prediction": str(prediction),
            "type": meta["problem_type"]
        }

    except Exception as e:
        print("🔥 PREDICT ERROR:", e)
        raise HTTPException(status_code=500, detail="Prediction failed")