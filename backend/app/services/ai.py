import os
from groq import Groq


# -----------------------------
# INITIALIZE CLIENT (CORRECT ✅)
# -----------------------------
def get_groq_client():
    """
    Initialize Groq client using environment variable.
    """

    # ✅ Correct: read VARIABLE NAME, not the key itself
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError(
            "GROQ_API_KEY not found. Set it in .env or environment variables."
        )

    return Groq(api_key=api_key)


# -----------------------------
# MAIN FUNCTION
# -----------------------------
def generate_ai_insights(summary: dict, missing: dict, columns: list):
    """
    Generate AI insights from dataset metadata.
    """

    try:
        client = get_groq_client()

        # -----------------------------
        # BUILD PROMPT
        # -----------------------------
        prompt = f"""
You are a professional data scientist.

Analyze the dataset based on the following:

Columns:
{columns}

Summary statistics:
{summary}

Missing values:
{missing}

Give:
1. Key insights
2. Patterns
3. Potential issues
4. Suggestions

Keep it short, clear, and useful.
"""

        # -----------------------------
        # CALL GROQ API
        # -----------------------------
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a data science expert."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
        )

        # -----------------------------
        # SAFE RESPONSE PARSE
        # -----------------------------
        if not response or not response.choices:
            return "⚠️ No response from AI"

        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"❌ AI Error: {str(e)}"