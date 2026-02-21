from __future__ import annotations

import math
from typing import Any


def make_feature_vector(game_state: dict[str, Any] | None) -> dict[str, float]:
    if not game_state:
        return {"score_diff": 0.0, "minutes_remaining": 60.0, "momentum": 0.0}

    home = float(game_state.get("home", 0))
    away = float(game_state.get("away", 0))
    quarter = float(game_state.get("quarter", 1))
    clock_seconds = float(game_state.get("clock_seconds_remaining", 900))
    minutes_remaining = ((4 - quarter) * 15) + (clock_seconds / 60.0)

    return {
        "score_diff": home - away,
        "minutes_remaining": max(0.0, minutes_remaining),
        "momentum": math.tanh(float(game_state.get("momentum_raw", 0.0))),
    }
