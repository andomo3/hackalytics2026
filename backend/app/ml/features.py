"""Feature engineering for egress threat prediction.

Builds a numeric feature vector from game state and optional traffic context.
Used by the heuristic predictor today and by the XGBoost model when trained.
"""

from __future__ import annotations

import math
from typing import Any

# ---------------------------------------------------------------------------
# Game-state feature names (used by predictor.py)
# ---------------------------------------------------------------------------
GAME_FEATURES = ("score_diff", "minutes_remaining", "momentum", "blowout_indicator", "time_pressure")

# ---------------------------------------------------------------------------
# Traffic feature names (optional; used when transit context is passed)
# ---------------------------------------------------------------------------
TRAFFIC_FEATURES = (
    "total_transit_load",
    "total_pedestrian_volume",
    "traffic_surge_ratio",
    "max_corridor_saturation",
)


def make_feature_vector(
    game_state: dict[str, Any] | None,
    transit_context: dict[str, dict[str, int]] | None = None,
    transit_baseline: dict[str, dict[str, float]] | None = None,
) -> dict[str, float]:
    """Build a feature dict for the egress model.

    Args:
        game_state: From NFL loader: quarter, clock, home, away, score_diff,
            clock_seconds_remaining, play, etc. Can be None outside game window.
        transit_context: Optional per-corridor loads for this minute, e.g.
            {"stadium_1st_ave": {"transit_load": 94, "pedestrian_volume": 235}, ...}.
            If None, traffic features are set to neutral defaults.
        transit_baseline: Optional per-corridor baseline (e.g. awdt * profile).
            Same keys as transit_context. If provided with transit_context,
            surge_ratio and max_corridor_saturation are computed.

    Returns:
        Dict of feature name -> float. Always includes game features;
        traffic features are 0 or 1.0 (neutral) when context not provided.
    """
    # ----- Game-state features -----
    if not game_state:
        out = {
            "score_diff": 0.0,
            "minutes_remaining": 60.0,
            "momentum": 0.0,
            "blowout_indicator": 0.0,
            "time_pressure": 0.0,
        }
    else:
        home = float(game_state.get("home", 0))
        away = float(game_state.get("away", 0))
        quarter = float(game_state.get("quarter", 1))
        clock_secs = float(game_state.get("clock_seconds_remaining", 900))
        minutes_remaining = ((4 - quarter) * 15) + (clock_secs / 60.0)
        minutes_remaining = max(0.0, minutes_remaining)

        score_diff = home - away
        momentum = math.tanh(float(game_state.get("momentum_raw", 0.0)))

        # Blowout: home team down 14+ in Q3 or later (fans leave early)
        blowout = 1.0 if (quarter >= 3 and score_diff <= -14) else 0.0

        # Time pressure: remaining time weighted by quarter (Q4 matters most)
        # 0 at game end, ~1 at kickoff; Q4 minutes count 2x in the weight
        if minutes_remaining <= 0:
            time_pressure = 0.0
        else:
            quarter_weight = 2.0 if quarter >= 4 else 1.0
            time_pressure = min(1.0, (minutes_remaining / 60.0) * quarter_weight)

        out = {
            "score_diff": score_diff,
            "minutes_remaining": minutes_remaining,
            "momentum": momentum,
            "blowout_indicator": blowout,
            "time_pressure": time_pressure,
        }
    # ----- Traffic features (optional) -----
    if not transit_context:
        out["total_transit_load"] = 0.0
        out["total_pedestrian_volume"] = 0.0
        out["traffic_surge_ratio"] = 1.0
        out["max_corridor_saturation"] = 1.0
        return out

    total_transit = sum(
        c.get("transit_load", 0) for c in transit_context.values()
    )
    total_ped = sum(
        c.get("pedestrian_volume", 0) for c in transit_context.values()
    )
    out["total_transit_load"] = float(total_transit)
    out["total_pedestrian_volume"] = float(total_ped)

    if transit_baseline:
        base_transit = sum(
            c.get("transit_load", 0.0) for c in transit_baseline.values()
        )
        base_ped = sum(
            c.get("pedestrian_volume", 0.0) for c in transit_baseline.values()
        )
        ratio_transit = (total_transit / base_transit) if base_transit > 0 else 1.0
        ratio_ped = (total_ped / base_ped) if base_ped > 0 else 1.0
        out["traffic_surge_ratio"] = max(ratio_transit, ratio_ped)
        # Per-corridor saturation: max of (current / baseline) over corridors
        saturations = []
        for loc_id, curr in transit_context.items():
            base = transit_baseline.get(loc_id) or {}
            b_t = base.get("transit_load", 0.0) or 1.0
            b_p = base.get("pedestrian_volume", 0.0) or 1.0
            t_ratio = curr.get("transit_load", 0) / b_t
            p_ratio = curr.get("pedestrian_volume", 0) / b_p
            saturations.append(max(t_ratio, p_ratio))
        out["max_corridor_saturation"] = max(saturations) if saturations else 1.0
    else:
        out["traffic_surge_ratio"] = 1.0
        out["max_corridor_saturation"] = 1.0

    return out
