from fastapi import APIRouter, UploadFile, File, Request, HTTPException
import pandas as pd
import os

router = APIRouter()

# -----------------------------
# PATH
# -----------------------------
DATA_PATH = "artifacts/data.csv"


@router.post("/upload/")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    try:
        # -----------------------------
        # READ CSV
        # -----------------------------
        df = pd.read_csv(file.file)

        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        # -----------------------------
        # CLEAN COLUMN NAMES (IMPORTANT)
        # -----------------------------
        df.columns = [col.strip() for col in df.columns]

        # -----------------------------
        # CREATE ARTIFACTS FOLDER
        # -----------------------------
        os.makedirs("artifacts", exist_ok=True)

        # -----------------------------
        # SAVE DATASET (🔥 REQUIRED FOR AUTO FEATURES)
        # -----------------------------
        df.to_csv(DATA_PATH, index=False)

        # -----------------------------
        # STORE IN GLOBAL STATE
        # -----------------------------
        request.app.state.df = df

        # -----------------------------
        # RESET MODEL STATE
        # -----------------------------
        request.app.state.model = None
        request.app.state.target_column = None

        # -----------------------------
        # OPTIONAL: DELETE OLD ARTIFACTS (AUTO CLEAN)
        # -----------------------------
        for file_name in ["model.pkl", "columns.pkl", "encoders.pkl"]:
            path = os.path.join("artifacts", file_name)
            if os.path.exists(path):
                os.remove(path)

        # -----------------------------
        # RESPONSE
        # -----------------------------
        return {
            "message": "Dataset uploaded successfully",
            "rows": df.shape[0],
            "columns": list(df.columns),
            "saved_to": DATA_PATH
        }

    except Exception as e:
        print("🔥 UPLOAD ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))