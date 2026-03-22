from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
import os
from app.routes import chat

# -----------------------------
# LOAD ENV VARIABLES (FIXED ✅)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path=ENV_PATH)


# -----------------------------
# IMPORT ROUTERS (ONLY ONCE)
# -----------------------------
from app.routes import (
    upload,
    visualize,
    train,
    predict,
    forecast,
    columns,
    insights,
    meta,
    ai,
)


# -----------------------------
# CREATE APP
# -----------------------------
app = FastAPI(
    title="inFera API",
    version="1.0.0",
    description="AI-powered Personal Data Scientist API 🚀",
)


# -----------------------------
# GLOBAL STATE (SINGLE SOURCE)
# -----------------------------
app.state.df = None
app.state.model = None
app.state.target_column = None


# -----------------------------
# 🔥 CORS CONFIG (FIXED FINAL)
# -----------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://in-fera.vercel.app",   # ✅ YOUR FRONTEND (IMPORTANT)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # ✅ specific allowed domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⚠️ DEBUG OPTION (if still fails, temporarily use this)
# allow_origins=["*"]


# -----------------------------
# INCLUDE ROUTERS (CLEAN)
# -----------------------------
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(visualize.router, prefix="/api", tags=["Visualization"])
app.include_router(train.router, prefix="/api", tags=["Training"])
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(forecast.router, prefix="/api", tags=["Forecast"])
app.include_router(columns.router, prefix="/api", tags=["Columns"])
app.include_router(insights.router, prefix="/api", tags=["Insights"])
app.include_router(meta.router, prefix="/api", tags=["Meta"])
app.include_router(ai.router, prefix="/api", tags=["AI"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])


# -----------------------------
# ROOT ENDPOINTS
# -----------------------------
@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "inFera API is running 🚀",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


# -----------------------------
# STARTUP LOG + DEBUG 🔥
# -----------------------------
@app.on_event("startup")
def startup_event():
    print("🚀 inFera backend started successfully")
    print("🔑 GROQ KEY LOADED:", os.getenv("GROQ_API_KEY"))
