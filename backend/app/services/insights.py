import pandas as pd
import numpy as np


def generate_insights(df: pd.DataFrame):
    insights = []

    # -------------------------
    # BASIC INFO
    # -------------------------
    rows, cols = df.shape
    insights.append(f"Dataset has {rows} rows and {cols} columns")

    # -------------------------
    # MISSING VALUES
    # -------------------------
    missing = df.isnull().sum().sum()
    if missing == 0:
        insights.append("No missing values detected")
    else:
        insights.append(f"Dataset has {missing} missing values")

    # -------------------------
    # TARGET DETECTION
    # -------------------------
    target_col = None

    for col in df.columns:
        unique_vals = df[col].nunique()
        if unique_vals <= 10:  # heuristic
            target_col = col
            break

    if target_col:
        insights.append(f"Target column detected: {target_col}")

        # -------------------------
        # PROBLEM TYPE
        # -------------------------
        if df[target_col].dtype == "object":
            insights.append("Problem type: Classification")
        else:
            insights.append("Problem type: Regression")

    # -------------------------
    # CORRELATION
    # -------------------------
    numeric_df = df.select_dtypes(include=np.number)

    if target_col and target_col in numeric_df.columns:
        corr = numeric_df.corr()[target_col].abs().sort_values(ascending=False)

        if len(corr) > 1:
            top_feature = corr.index[1]
            insights.append(f"Most correlated feature with target: {top_feature}")

    # -------------------------
    # DATA TYPE SUMMARY
    # -------------------------
    num_cols = len(df.select_dtypes(include=np.number).columns)
    cat_cols = len(df.select_dtypes(include="object").columns)

    insights.append(f"{num_cols} numerical columns detected")
    insights.append(f"{cat_cols} categorical columns detected")

    return insights