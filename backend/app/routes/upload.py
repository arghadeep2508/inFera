from fastapi import APIRouter, UploadFile, File, Request, HTTPException
import pandas as pd
import os

router = APIRouter()

# -----------------------------
# PATH (ABSOLUTE SAFE PATH)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
DATA_PATH = os.path.join(ARTIFACTS_DIR, "data.csv")


@router.post("/upload/")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    try:
        # -----------------------------
        # VALIDATE FILE TYPE
        # -----------------------------
        if not file.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")

        # -----------------------------
        # READ CSV
        # -----------------------------
        df = pd.read_csv(file.file)

        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        # -----------------------------
        # CLEAN COLUMN NAMES
        # -----------------------------
        df.columns = [col.strip() for col in df.columns]

        # -----------------------------
        # CREATE ARTIFACTS FOLDER (SAFE)
        # -----------------------------
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)

        # -----------------------------
        # SAVE DATASET (🔥 CRITICAL FIX)
        # -----------------------------
        df.to_csv(DATA_PATH, index=False)

        # -----------------------------
        # STORE IN MEMORY (FAST ACCESS)
        # -----------------------------
        request.app.state.df = df

        # -----------------------------
        # RESET MODEL STATE
        # -----------------------------
        request.app.state.model = None
        request.app.state.target_column = None

        # -----------------------------
        # CLEAN OLD ARTIFACTS
        # -----------------------------
        for file_name in ["model.pkl", "columns.pkl", "encoders.pkl"]:
            path = os.path.join(ARTIFACTS_DIR, file_name)
            if os.path.exists(path):
                os.remove(path)

        # -----------------------------
        # RESPONSE
        # -----------------------------
        return {
            "message": "Dataset uploaded successfully",
            "rows": int(df.shape[0]),
            "columns": list(df.columns),
            "saved_to": DATA_PATH
        }

    except Exception as e:
        print("🔥 UPLOAD ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
