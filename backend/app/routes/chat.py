from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai import get_groq_client

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


@router.post("/chat/")
def chat_with_data(request: ChatRequest):
    try:
        from app.main import app

        df = app.state.df

        if df is None:
            raise HTTPException(status_code=400, detail="No dataset uploaded")

        # -----------------------------
        # PREPARE DATA CONTEXT
        # -----------------------------
        columns = list(df.columns)
        summary = df.describe(include="all").fillna("").to_dict()
        preview = df.head(10).to_dict(orient="records")

        # -----------------------------
        # PROMPT
        # -----------------------------
        prompt = f"""
You are an expert data scientist.

Dataset columns:
{columns}

Summary:
{summary}

Sample data:
{preview}

User question:
{request.question}

Answer clearly and concisely based ONLY on the dataset.
Avoid hallucination.
"""

        client = get_groq_client()

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # ✅ UPDATED MODEL
            messages=[
                {"role": "system", "content": "You are a data science expert."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )

        return {
            "status": "success",
            "answer": response.choices[0].message.content,
        }

    except Exception as e:
        print("🔥 CHAT ERROR:", e)
        raise HTTPException(status_code=500, detail="Chat failed")