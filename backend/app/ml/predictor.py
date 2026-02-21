from __future__ import annotations

from app.ml.features import make_feature_vector


def predict_egress_threat(game_state: dict | None) -> tuple[float, int]:
    features = make_feature_vector(game_state)
    score_diff = abs(features["score_diff"])
    minutes_remaining = features["minutes_remaining"]

    threat_score = min(1.0, (score_diff / 28.0) + (1.0 - min(1.0, minutes_remaining / 60.0)))
    estimated_crowd = int(threat_score * 68000)
    return round(threat_score, 3), estimated_crowd
