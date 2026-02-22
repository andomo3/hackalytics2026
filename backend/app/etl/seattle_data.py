"""Seattle traffic data ETL.

Loads the 15-minute-bin traffic counts CSV to build a normalised hourly traffic
profile, then combines it with per-corridor daily volumes (from the 2022 Traffic
Flow Counts study) to produce synthetic 1 440-minute game-day timelines for each
scenario.  Results are written to the ``transit_cache`` table.
"""

from __future__ import annotations

import asyncio
import math
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy import delete

from app.db.models import TransitCache
from app.db.session import AsyncSessionLocal, init_db
from app.etl.scenarios import SCENARIOS

PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _resolve_data_file(filename: str) -> Path:
    candidates = [
        PROJECT_ROOT / "mainData" / filename,
        PROJECT_ROOT / "exports" / filename,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    # Default to legacy location for clearer error messages downstream.
    return candidates[0]

# --------------------------------------------------------------------------- 
# Stadium-area corridors
# AWDT (Average Weekday Daily Traffic) sourced from 2022 Traffic Flow Counts.
# ped_ratio  – estimated foot-traffic-to-vehicle ratio (higher near stations).
# proximity  – 0-1 factor scaling how strongly a game-day event affects the
#              corridor (1.0 = directly outside the stadium gates).
# ---------------------------------------------------------------------------
CORRIDORS: dict[str, dict] = {
    "stadium_1st_ave": {"awdt": 21_583, "ped_ratio": 2.5, "proximity": 1.0},
    "king_street":     {"awdt":  4_918, "ped_ratio": 3.0, "proximity": 0.7},
    "royal_brougham":  {"awdt":  8_678, "ped_ratio": 1.5, "proximity": 0.9},
    "4th_ave_s":       {"awdt": 19_337, "ped_ratio": 1.2, "proximity": 0.5},
    "occidental_ave":  {"awdt":    387, "ped_ratio": 8.0, "proximity": 1.0},
    "s_atlantic_st":   {"awdt": 13_910, "ped_ratio": 1.0, "proximity": 0.6},
}

# ---------------------------------------------------------------------------
# Game-day timing constants (minutes from midnight)
# ---------------------------------------------------------------------------
GAME_START = 18 * 60 + 30  # 18:30 kickoff
GAME_END = 21 * 60         # 21:00 final whistle
ARRIVAL_WINDOW = 120        # fans arrive over 2 h before kickoff
SETTLE_TIME = 20            # minutes for traffic to drop once game begins

# ---------------------------------------------------------------------------
# Per-scenario multiplier profiles
# ---------------------------------------------------------------------------
SCENARIO_PROFILES: dict[str, dict] = {
    "scenario_a_normal_exit": {
        "pregame_peak": 2.0,
        "during_game": 0.6,
        "postgame_peak": 3.5,
        "postgame_decay": 60,
        "early_exit": None,
    },
    "scenario_b_close_game": {
        "pregame_peak": 3.0,
        "during_game": 0.5,
        "postgame_peak": 6.0,
        "postgame_decay": 45,
        "early_exit": None,
    },
    "scenario_c_blowout_q3": {
        "pregame_peak": 3.0,
        "during_game": 0.5,
        "postgame_peak": 7.0,
        "postgame_decay": 75,
        "early_exit": 20 * 60,  # 20:00 – Q3 blowout triggers mass exodus
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _smooth(t: float) -> float:
    """Half-cosine ramp: smooth 0 -> 1 transition."""
    return 0.5 * (1.0 - math.cos(math.pi * max(0.0, min(1.0, t))))


def _load_hourly_profile() -> np.ndarray:
    """Return a 1 440-element array where ``profile[m]`` is the fraction of
    daily traffic occurring at minute *m*, derived from the 15-min bin CSV."""
    csv_path = _resolve_data_file("seattle_traffic_counts_2018plus.csv")
    df = pd.read_csv(
        csv_path,
        usecols=["current_count", "count_hour", "count_minute"],
    )

    avg = (
        df.groupby(["count_hour", "count_minute"])["current_count"]
        .mean()
        .reset_index()
        .sort_values(["count_hour", "count_minute"])
    )

    profile = np.ones(1440, dtype=np.float64)
    for _, row in avg.iterrows():
        start = int(row["count_hour"]) * 60 + int(row["count_minute"])
        value = max(float(row["current_count"]), 1.0)
        for offset in range(min(15, 1440 - start)):
            profile[start + offset] = value

    profile /= profile.sum()
    return profile


def _event_multiplier(minute: int, cfg: dict, proximity: float) -> float:
    """Traffic multiplier for *minute* given a scenario config.

    ``proximity`` (0–1) scales the event impact so that corridors further from
    the stadium see a smaller deviation from baseline.
    """
    arrival_start = GAME_START - ARRIVAL_WINDOW
    egress_start = cfg["early_exit"] if cfg["early_exit"] is not None else GAME_END
    egress_end = egress_start + cfg["postgame_decay"]

    if minute < arrival_start:
        return 1.0

    # Arrival ramp: 1.0 → pregame_peak
    if minute < GAME_START:
        t = (minute - arrival_start) / ARRIVAL_WINDOW
        raw = 1.0 + (cfg["pregame_peak"] - 1.0) * _smooth(t)
        return 1.0 + (raw - 1.0) * proximity

    # During game: pregame_peak settles down to during_game
    if minute < egress_start:
        if minute < GAME_START + SETTLE_TIME:
            t = (minute - GAME_START) / SETTLE_TIME
            level = cfg["pregame_peak"] + (cfg["during_game"] - cfg["pregame_peak"]) * _smooth(t)
        else:
            level = cfg["during_game"]
        return 1.0 + (level - 1.0) * proximity

    # Egress surge: during_game → postgame_peak → 1.0
    if minute <= egress_end:
        t = (minute - egress_start) / cfg["postgame_decay"]
        peak_frac = 0.20
        if t <= peak_frac:
            intensity = _smooth(t / peak_frac)
            raw = cfg["during_game"] + (cfg["postgame_peak"] - cfg["during_game"]) * intensity
        else:
            decay = _smooth((t - peak_frac) / (1.0 - peak_frac))
            raw = cfg["postgame_peak"] + (1.0 - cfg["postgame_peak"]) * decay
        return 1.0 + (raw - 1.0) * proximity

    return 1.0


# ---------------------------------------------------------------------------
# Row builder
# ---------------------------------------------------------------------------

def _build_scenario_rows(
    scenario_id: str,
    profile: np.ndarray,
) -> list[TransitCache]:
    """Generate ``TransitCache`` objects for every minute × corridor."""
    cfg = SCENARIO_PROFILES[scenario_id]
    rows: list[TransitCache] = []

    for loc_id, corridor in CORRIDORS.items():
        awdt = corridor["awdt"]
        ped_ratio = corridor["ped_ratio"]
        prox = corridor["proximity"]

        for minute in range(1440):
            base = awdt * profile[minute]
            mult = _event_multiplier(minute, cfg, prox)
            transit_load = max(1, int(base * mult))
            pedestrian_volume = max(1, int(base * mult * ped_ratio))

            rows.append(
                TransitCache(
                    scenario_id=scenario_id,
                    minute=minute,
                    location_id=loc_id,
                    transit_load=transit_load,
                    pedestrian_volume=pedestrian_volume,
                )
            )

    return rows


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def ingest_seattle_traffic_data() -> None:
    """Load traffic CSVs, build game-day timelines, populate transit_cache."""
    await init_db()

    print("Loading hourly traffic profile from 15-min bin data …")
    profile = _load_hourly_profile()

    async with AsyncSessionLocal() as session:
        print("Clearing existing transit_cache rows …")
        await session.execute(delete(TransitCache))
        await session.commit()

        for scenario_id in SCENARIOS:
            print(f"  Building {scenario_id} …")
            rows = _build_scenario_rows(scenario_id, profile)
            session.add_all(rows)
            await session.commit()
            print(f"    -> {len(rows):,} rows inserted")

    print("Transit cache populated successfully.")


if __name__ == "__main__":
    asyncio.run(ingest_seattle_traffic_data())
