import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder


def preprocess_data(df: pd.DataFrame, target: str = None):
    df = df.copy()

    encoders = {}

    # -----------------------------
    # HANDLE MISSING VALUES
    # -----------------------------
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].fillna("Unknown")
        else:
            df[col] = df[col].fillna(df[col].median())

    # -----------------------------
    # ENCODE CATEGORICAL
    # -----------------------------
    for col in df.select_dtypes(include="object").columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le

    # -----------------------------
    # SPLIT X, y
    # -----------------------------
    if target:
        X = df.drop(columns=[target])
        y = df[target]
    else:
        X = df
        y = None

    return X, y, encoders