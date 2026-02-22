"""Offline XGBoost training for egress threat prediction.

Generates synthetic training labels from ALL games in the NFL play-by-play CSV
using domain heuristics, then trains two XGBoost regressors:
  1. egress_threat_score  (0.0 – 1.0)
  2. estimated_crowd_volume (0 – stadium capacity)

The trained model is saved as a joblib file that predictor.py loads at runtime.

Usage:
    cd backend && ../venv/bin/python3 -m app.ml.train
"""

from __future__ import annotations


from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from xgboost import XGBRegressor

from app.ml.features import GAME_FEATURES

PROJECT_ROOT = Path(__file__).resolve().parents[3]
NFL_CSV = PROJECT_ROOT / "mainData" / "NFL Play by Play 2009-2018 (v5).csv"
MODEL_DIR = Path(__file__).resolve().parent
MODEL_PATH = MODEL_DIR / "egress_model.joblib"

STADIUM_CAPACITY = 68_000

# RandomizedSearchCV parameter distributions
_PARAM_GRID = {
    "n_estimators": [100, 150, 200, 250, 300],
    "max_depth": [3, 4, 5, 6, 7],
    "learning_rate": [0.05, 0.08, 0.1, 0.15, 0.2],
    "subsample": [0.6, 0.7, 0.8, 0.9, 1.0],
    "colsample_bytree": [0.6, 0.7, 0.8, 0.9, 1.0],
    "min_child_weight": [1, 3, 5, 7],
    "reg_alpha": [0.0, 0.01, 0.1, 1.0],
    "reg_lambda": [0.1, 1.0, 5.0, 10.0],
}
_N_ITER = 25
_CV = 3

_NFL_COLS = [
    "game_id", "qtr", "time", "game_seconds_remaining",
    "total_home_score", "total_away_score",
]


# ---------------------------------------------------------------------------
# Synthetic label generation (domain heuristics)
# ---------------------------------------------------------------------------

def _heuristic_threat(score_diff: float, minutes_remaining: float,
                      quarter: float) -> float:
    """Generate a synthetic egress_threat_score label.

    Captures three main egress drivers:
      - End-of-game pressure (time running out → everyone leaves)
      - Blowout exodus (big deficit in Q3+ → fans leave early)
      - Score-differential effect (larger gaps → more departures)
    """
    time_factor = max(0.0, 1.0 - minutes_remaining / 60.0)

    diff_abs = abs(score_diff)
    diff_factor = min(1.0, diff_abs / 28.0)

    blowout_boost = 0.0
    if quarter >= 3 and score_diff <= -14:
        blowout_boost = 0.3 * min(1.0, diff_abs / 35.0)

    raw = 0.5 * time_factor + 0.3 * diff_factor + blowout_boost

    # Suppress threat in early game (Q1-Q2 with lots of time left)
    if minutes_remaining > 45:
        raw *= 0.3
    elif minutes_remaining > 30:
        raw *= 0.6

    return max(0.0, min(1.0, raw))


def _format_clock_seconds(time_str) -> float:
    """Convert 'MM:SS' or 'M:SS' to seconds. Returns 900 on failure."""
    if pd.isna(time_str):
        return 900.0
    s = str(time_str).strip()
    parts = s.split(":")
    if len(parts) >= 2:
        try:
            return int(parts[0]) * 60 + int(parts[1])
        except ValueError:
            return 900.0
    return 900.0


# ---------------------------------------------------------------------------
# Training data builder
# ---------------------------------------------------------------------------

def build_training_data() -> pd.DataFrame:
    """Build feature matrix + labels from all NFL games in the CSV."""
    print(f"Loading NFL play-by-play from {NFL_CSV} …")
    df = pd.read_csv(NFL_CSV, usecols=_NFL_COLS, encoding="utf-8-sig")
    print(f"  {len(df):,} plays across {df['game_id'].nunique():,} games")

    df = df.dropna(subset=["game_seconds_remaining", "qtr"])
    df = df[df["qtr"].isin([1, 2, 3, 4, 5])]

    records: list[dict] = []

    for _, game_df in df.groupby("game_id"):
        game_df = game_df.sort_values("game_seconds_remaining", ascending=False)

        for _, play in game_df.iterrows():
            quarter = float(play["qtr"])
            clock_secs = float(play.get("game_seconds_remaining", 0))
            # game_seconds_remaining is total across all quarters
            minutes_remaining = max(0.0, clock_secs / 60.0)

            home = float(play["total_home_score"]) if not pd.isna(play["total_home_score"]) else 0.0
            away = float(play["total_away_score"]) if not pd.isna(play["total_away_score"]) else 0.0
            score_diff = home - away

            blowout = 1.0 if (quarter >= 3 and score_diff <= -14) else 0.0

            if minutes_remaining <= 0:
                time_pressure = 0.0
            else:
                quarter_weight = 2.0 if quarter >= 4 else 1.0
                time_pressure = min(1.0, (minutes_remaining / 60.0) * quarter_weight)

            momentum = 0.0  # no per-play momentum in this dataset

            threat = _heuristic_threat(score_diff, minutes_remaining, quarter)
            crowd = int(threat * STADIUM_CAPACITY)

            records.append({
                "score_diff": score_diff,
                "minutes_remaining": minutes_remaining,
                "momentum": momentum,
                "blowout_indicator": blowout,
                "time_pressure": time_pressure,
                "threat_label": threat,
                "crowd_label": crowd,
            })

    training_df = pd.DataFrame(records)
    print(f"  Built {len(training_df):,} training samples")
    return training_df


# ---------------------------------------------------------------------------
# Model training
# ---------------------------------------------------------------------------

def train_model() -> None:
    training_df = build_training_data()

    feature_cols = list(GAME_FEATURES)
    X = training_df[feature_cols].values
    y_threat = training_df["threat_label"].values
    y_crowd = training_df["crowd_label"].values

    X_train, X_test, yt_train, yt_test, yc_train, yc_test = train_test_split(
        X, y_threat, y_crowd, test_size=0.15, random_state=42,
    )

    base = XGBRegressor(random_state=42, verbosity=0)

    print("\nRandomizedSearchCV for threat score model …")
    threat_search = RandomizedSearchCV(
        base,
        param_distributions=_PARAM_GRID,
        n_iter=_N_ITER,
        cv=_CV,
        scoring="r2",
        random_state=42,
        n_jobs=1,
        verbose=1,
    )
    threat_search.fit(X_train, yt_train)
    threat_model = threat_search.best_estimator_
    threat_score = threat_model.score(X_test, yt_test)
    print(f"  Best params: {threat_search.best_params_}")
    print(f"  Best CV R²:  {threat_search.best_score_:.4f}")
    print(f"  Test R²:    {threat_score:.4f}")

    print("\nRandomizedSearchCV for crowd volume model …")
    crowd_search = RandomizedSearchCV(
        base,
        param_distributions=_PARAM_GRID,
        n_iter=_N_ITER,
        cv=_CV,
        scoring="r2",
        random_state=43,
        n_jobs=1,  # use n_jobs=-1 for parallel CV when not in sandbox
        verbose=1,
    )
    crowd_search.fit(X_train, yc_train)
    crowd_model = crowd_search.best_estimator_
    crowd_score = crowd_model.score(X_test, yc_test)
    print(f"  Best params: {crowd_search.best_params_}")
    print(f"  Best CV R²:  {crowd_search.best_score_:.4f}")
    print(f"  Test R²:    {crowd_score:.4f}")

    bundle = {
        "threat_model": threat_model,
        "crowd_model": crowd_model,
        "feature_names": feature_cols,
        "stadium_capacity": STADIUM_CAPACITY,
    }
    joblib.dump(bundle, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    train_model()
