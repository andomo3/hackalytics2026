"""Monte Carlo surge simulation for CrowdShield demo timelines.

This module transforms point-estimate ML outputs into a stochastic surge curve
and extracts the 95th percentile (worst-case planning envelope) per minute.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

CRITICAL_CAPACITY_THRESHOLD = 133


@dataclass(frozen=True)
class SimulationConfig:
    num_simulations: int = 10_000
    random_seed: int = 42
    critical_capacity_threshold: int = CRITICAL_CAPACITY_THRESHOLD


def _as_game_value(game_state: dict[str, Any] | None, *keys: str, default: float = 0.0) -> float:
    if not game_state:
        return default
    for key in keys:
        if key in game_state and game_state[key] is not None:
            try:
                return float(game_state[key])
            except (TypeError, ValueError):
                continue
    return default


def simulate_surge_velocity(
    timeline: list[dict[str, Any]],
    config: SimulationConfig | None = None,
) -> np.ndarray:
    """Return per-minute p95 surge velocity (fans/minute).

    Inputs in ``timeline`` are expected to include:
    - ``egress_threat_score`` (or ``threat_score``)
    - ``estimated_crowd_volume``
    - ``game_state`` with score + quarter
    """

    cfg = config or SimulationConfig()
    if not timeline:
        return np.array([], dtype=np.int32)

    n_minutes = len(timeline)
    minutes = np.arange(n_minutes, dtype=np.float64)

    threat = np.array(
        [
            float(frame.get("egress_threat_score", frame.get("threat_score", 0.0)) or 0.0)
            for frame in timeline
        ],
        dtype=np.float64,
    )
    threat = np.clip(threat, 0.0, 1.0)

    estimated_crowd = np.array(
        [float(frame.get("estimated_crowd_volume", 0) or 0) for frame in timeline],
        dtype=np.float64,
    )
    estimated_crowd = np.clip(estimated_crowd, 0.0, 68_000.0)

    score_diff = np.array(
        [
            _as_game_value(frame.get("game_state"), "score_diff", default=0.0)
            if frame.get("game_state") and frame["game_state"].get("score_diff") is not None
            else (
                _as_game_value(frame.get("game_state"), "home", default=0.0)
                - _as_game_value(frame.get("game_state"), "away", default=0.0)
            )
            for frame in timeline
        ],
        dtype=np.float64,
    )
    quarter = np.array(
        [_as_game_value(frame.get("game_state"), "qtr", "quarter", default=0.0) for frame in timeline],
        dtype=np.float64,
    )

    # Baseline deterministic rate from the current point-estimate stack.
    baseline_rate = 12.0 + (estimated_crowd / 68_000.0) * 95.0 + threat * 105.0

    # Blowout condition: home losing by 21+ in Q3/Q4.
    blowout_mask = (score_diff <= -21.0) & (quarter >= 3.0)

    # Time-centered surge wave around catalyst minute 1125.
    catalyst_wave = np.exp(-0.5 * ((minutes - 1125.0) / 18.0) ** 2)

    # Massive momentum multiplier during blowout to model early exodus tail risk.
    momentum_multiplier = np.where(
        blowout_mask,
        2.4 + 0.9 * catalyst_wave + 0.6 * threat,
        1.0 + 0.25 * catalyst_wave + 0.2 * threat,
    )

    mean_rate = np.clip(baseline_rate * momentum_multiplier, 5.0, None)
    sigma_rate = np.maximum(4.0, mean_rate * np.where(blowout_mask, 0.48, 0.24))

    rng = np.random.default_rng(cfg.random_seed)
    samples = rng.normal(
        loc=mean_rate[:, np.newaxis],
        scale=sigma_rate[:, np.newaxis],
        size=(n_minutes, cfg.num_simulations),
    )
    samples = np.clip(samples, 0.0, None)

    p95 = np.percentile(samples, 95, axis=1)
    return np.rint(p95).astype(np.int32)

