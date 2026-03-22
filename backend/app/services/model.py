import pandas as pd
import numpy as np
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score

from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor


def train_model(df: pd.DataFrame, target: str = None):

    # -----------------------------
    # VALIDATION
    # -----------------------------
    if df is None or df.empty:
        return {"error": "Empty dataset"}

    if df.shape[1] < 2:
        return {"error": "Need at least 2 columns"}

    # -----------------------------
    # CLEAN COLUMN NAMES
    # -----------------------------
    df.columns = [str(col).strip() for col in df.columns]

    # Remove duplicate columns
    df = df.loc[:, ~df.columns.duplicated()]

    # Replace missing symbols
    df = df.replace(["?", "NA", "N/A", ""], np.nan)

    # -----------------------------
    # TARGET DETECTION
    # -----------------------------
    if target is None:
        target = df.columns[-1]

    target = target.strip()

    if target not in df.columns:
        return {"error": f"Target column '{target}' not found"}

    # Drop rows where target missing
    df = df.dropna(subset=[target])

    if df.shape[0] < 10:
        return {"error": "Not enough data after cleaning"}

    # -----------------------------
    # SPLIT
    # -----------------------------
    X = df.drop(columns=[target]).copy()
    y = df[target].copy()

    target_name = y.name

    # -----------------------------
    # REMOVE CONSTANT COLUMNS
    # -----------------------------
    nunique = X.nunique()
    constant_cols = nunique[nunique <= 1].index.tolist()

    if constant_cols:
        X = X.drop(columns=constant_cols)

    if X.shape[1] == 0:
        return {"error": "No usable features after cleaning"}

    # -----------------------------
    # TYPE DETECTION
    # -----------------------------
    numeric_features = X.select_dtypes(include=np.number).columns.tolist()
    categorical_features = X.select_dtypes(exclude=np.number).columns.tolist()

    # -----------------------------
    # PREPROCESSING
    # -----------------------------
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features)
        ],
        remainder="drop"
    )

    # -----------------------------
    # PROBLEM TYPE DETECTION
    # -----------------------------
    unique_values = y.nunique()

    if y.dtype == "object" or unique_values <= 20:
        problem_type = "classification"

        if unique_values < 2:
            return {"error": "Target has only one class"}

        model = RandomForestClassifier(
            n_estimators=150,
            random_state=42,
            n_jobs=-1
        )

        stratify = y

    else:
        problem_type = "regression"

        model = RandomForestRegressor(
            n_estimators=150,
            random_state=42,
            n_jobs=-1
        )

        stratify = None

    # -----------------------------
    # PIPELINE
    # -----------------------------
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ])

    # -----------------------------
    # TRAIN TEST SPLIT
    # -----------------------------
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.2,
            random_state=42,
            stratify=stratify if problem_type == "classification" else None
        )
    except Exception as e:
        return {"error": f"Split failed: {str(e)}"}

    # -----------------------------
    # TRAIN
    # -----------------------------
    try:
        pipeline.fit(X_train, y_train)
    except Exception as e:
        return {"error": f"Training failed: {str(e)}"}

    # -----------------------------
    # PREDICT
    # -----------------------------
    try:
        preds = pipeline.predict(X_test)
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

    # -----------------------------
    # EVALUATION
    # -----------------------------
    try:
        if problem_type == "classification":
            score = accuracy_score(y_test, preds)
        else:
            score = r2_score(y_test, preds)
    except:
        score = 0

    # -----------------------------
    # SAVE ARTIFACTS
    # -----------------------------
    os.makedirs("artifacts", exist_ok=True)

    joblib.dump(pipeline, "artifacts/model.pkl")
    joblib.dump(X.columns.tolist(), "artifacts/columns.pkl")

    metadata = {
        "target": target_name,
        "problem_type": problem_type,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "dropped_columns": constant_cols
    }

    joblib.dump(metadata, "artifacts/meta.pkl")

    # -----------------------------
    # RESPONSE
    # -----------------------------
    return {
        "status": "success",
        "problem_type": problem_type,
        "target": target_name,
        "score": round(float(score), 4),
        "features_used": len(X.columns),
        "rows_used": int(df.shape[0])
    }