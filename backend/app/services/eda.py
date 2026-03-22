import pandas as pd

def generate_eda(df: pd.DataFrame):

    eda = {}

    eda["describe"] = df.describe().to_dict()
    eda["columns"] = list(df.columns)

    # Correlation (only numeric)
    try:
        eda["correlation"] = df.corr(numeric_only=True).to_dict()
    except:
        eda["correlation"] = {}

    return eda