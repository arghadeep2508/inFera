from fastapi import APIRouter, Request, HTTPException

router = APIRouter()  # ✅ NO PREFIX


@router.get("/meta/")
def get_meta(request: Request):
    try:
        df = request.app.state.df  # ✅ SINGLE SOURCE OF TRUTH

        if df is None:
            raise HTTPException(status_code=400, detail="No dataset uploaded yet")

        # -----------------------------
        # DETECT TYPES
        # -----------------------------
        categorical = df.select_dtypes(include="object").columns.tolist()
        numerical = df.select_dtypes(exclude="object").columns.tolist()

        # -----------------------------
        # UNIQUE VALUES (FOR DROPDOWN)
        # -----------------------------
        values = {}

        for col in categorical:
            unique_vals = df[col].dropna().unique().tolist()

            # 🔥 LIMIT VALUES (performance safe)
            values[col] = unique_vals[:50]

        return {
            "categorical": categorical,
            "numerical": numerical,
            "values": values
        }

    except HTTPException:
        raise

    except Exception as e:
        print("🔥 META ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))