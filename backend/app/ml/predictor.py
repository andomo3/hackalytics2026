"""Egress threat predictor — XGBoost with heuristic fallback.

Loads the trained model bundle from egress_model.joblib (produced by train.py).
If the file is missing or corrupt, falls back to the original heuristic so the
rest of the pipeline never breaks.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import numpy as np

from app.ml.features import make_feature_vector

log = logging.getLogger(__name__)

_MODEL_PATH = Path(__file__).resolve().parent / "egress_model.joblib"
_BUNDLE: dict[str, Any] | None = None
_LOADED = False

STADIUM_CAPACITY = 68_000


def _ensure_model() -> dict[str, Any] | None:
    """Lazy-load the model bundle once."""
    global _BUNDLE, _LOADED
    if _LOADED:
        return _BUNDLE
    _LOADED = True
    if not _MODEL_PATH.exists():
        log.warning("No trained model at %s — using heuristic fallback", _MODEL_PATH)
        return None
    try:
        import joblib
        _BUNDLE = joblib.load(_MODEL_PATH)
        log.info("Loaded XGBoost model from %s", _MODEL_PATH)
    except Exception:
        log.exception("Failed to load model — using heuristic fallback")
        _BUNDLE = None
    return _BUNDLE


def _heuristic_predict(features: dict[str, float]) -> tuple[float, int]:
    """Original rule-based fallback."""
    score_diff = abs(features["score_diff"])
    minutes_remaining = features["minutes_remaining"]
    threat = min(1.0, (score_diff / 28.0) + (1.0 - min(1.0, minutes_remaining / 60.0)))
    crowd = int(threat * STADIUM_CAPACITY)
    return round(threat, 3), crowd


def predict_egress_threat(game_state: dict | None) -> tuple[float, int]:
    """Return (threat_score, estimated_crowd) for a given game state.

    Uses trained XGBoost models when available; heuristic otherwise.
    """
    features = make_feature_vector(game_state)
    bundle = _ensure_model()

    if bundle is None:
        return _heuristic_predict(features)

    feature_names: list[str] = bundle["feature_names"]
    X = np.array([[features[f] for f in feature_names]])

    threat_score = float(bundle["threat_model"].predict(X)[0])
    threat_score = max(0.0, min(1.0, round(threat_score, 3)))

    crowd = int(bundle["crowd_model"].predict(X)[0])
    crowd = max(0, min(bundle.get("stadium_capacity", STADIUM_CAPACITY), crowd))

    return threat_score, crowd
