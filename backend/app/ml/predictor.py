"""Egress threat predictor - XGBoost with heuristic fallback.

Loads the trained model bundle from egress_model.joblib (produced by train.py).
If the file is missing or corrupt, falls back to the original heuristic so the
rest of the pipeline never breaks.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

import numpy as np

from app.ml.features import make_feature_vector

log = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "egress_model.joblib"
_BUNDLE: dict[str, Any] | None = None
_LOADED = False

STADIUM_CAPACITY = 68_000


def _candidate_model_paths() -> list[Path]:
    """Return candidate locations for the trained model artifact."""
    candidates: list[Path] = []

    env_path = os.getenv("EGRESS_MODEL_PATH", "").strip()
    if env_path:
        candidates.append(Path(env_path))

    candidates.extend([
        _DEFAULT_MODEL_PATH,
        _PROJECT_ROOT / "exports" / "egress_model.joblib",
        _PROJECT_ROOT / "mainData" / "egress_model.joblib",
        Path("/mainData/egress_model.joblib"),
        Path("/mainData/models/egress_model.joblib"),
    ])

    # Preserve order while removing duplicates.
    deduped: list[Path] = []
    seen: set[str] = set()
    for path in candidates:
        key = str(path)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(path)
    return deduped


def model_search_paths() -> list[Path]:
    """Public helper for scripts to display where model lookup happens."""
    return _candidate_model_paths()


def resolve_model_path() -> Path | None:
    """Resolve the first existing model path from known candidates."""
    for path in _candidate_model_paths():
        if path.exists():
            return path
    return None


def _ensure_model() -> dict[str, Any] | None:
    """Lazy-load the model bundle once."""
    global _BUNDLE, _LOADED
    if _LOADED:
        return _BUNDLE

    _LOADED = True
    model_path = resolve_model_path()
    if model_path is None:
        searched = ", ".join(str(p) for p in _candidate_model_paths())
        log.warning(
            "No trained model found. Searched: %s. Using heuristic fallback.",
            searched,
        )
        return None

    try:
        import joblib

        _BUNDLE = joblib.load(model_path)
        log.info("Loaded XGBoost model from %s", model_path)
    except Exception:
        log.exception("Failed to load model from %s. Using heuristic fallback.", model_path)
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
