from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[3]
NFL_CSV = PROJECT_ROOT / "mainData" / "NFL Play by Play 2009-2018 (v5).csv"

# ---------------------------------------------------------------------------
# Game selection — three SEA home games matching our scenario profiles
# ---------------------------------------------------------------------------
GAME_MAPPING: dict[str, int] = {
    "scenario_a_normal_exit": 2018092312,   # SEA 24-13 DAL — comfortable home win
    "scenario_b_close_game":  2017102908,   # SEA 40-38 HOU — nail-biter, 2-pt margin
    "scenario_c_blowout_q3":  2017121708,   # SEA  7-42  LA — down 0-34 at half
}

# ---------------------------------------------------------------------------
# Wall-clock mapping constants
# An NFL game has 3 600 game-seconds (four 15-min quarters).  Real elapsed time
# is ~150 minutes including stoppages, commercials, and halftime.
# ---------------------------------------------------------------------------
GAME_START_MINUTE = 18 * 60 + 30   # 18:30 kickoff
HALF_DURATION = 65                  # real minutes per half
HALFTIME_BREAK = 20                 # halftime intermission

_SECOND_HALF_START = GAME_START_MINUTE + HALF_DURATION + HALFTIME_BREAK
_GAME_END_MINUTE = _SECOND_HALF_START + HALF_DURATION  # ~21:00

_COLS = [
    "game_id", "qtr", "time", "game_seconds_remaining",
    "total_home_score", "total_away_score",
    "desc", "play_type", "home_team", "away_team",
    "touchdown", "interception", "fumble_lost",
    "score_differential", "epa",
]


def _game_seconds_to_wall_minute(game_secs: float) -> int:
    """Map ``game_seconds_remaining`` (3 600→0) to our daily-minute timeline.

    First half  (3 600→1 800) → minutes 1 110 – 1 175
    Halftime                  → minutes 1 175 – 1 195  (no plays)
    Second half (1 800→0)     → minutes 1 195 – 1 260
    """
    if game_secs > 1800:
        frac = (3600 - game_secs) / 1800
        return GAME_START_MINUTE + int(frac * HALF_DURATION)
    frac = (1800 - game_secs) / 1800
    return _SECOND_HALF_START + int(frac * HALF_DURATION)


def _format_clock(time_str: str | float) -> str:
    """Normalise the ``time`` column (e.g. '8:22' or '8:22:00') to 'M:SS'."""
    if pd.isna(time_str):
        return "0:00"
    s = str(time_str).strip()
    parts = s.split(":")
    if len(parts) >= 2:
        return f"{int(parts[0])}:{parts[1].zfill(2)}"
    return s


def _summarise_play(desc: str | float) -> str:
    """Return a short version of the play description (max 120 chars)."""
    if pd.isna(desc):
        return ""
    return str(desc)[:120]


def _build_game_timeline(game_df: pd.DataFrame) -> dict[int, dict[str, Any]]:
    """Convert a single game's play-by-play into a {wall_minute: game_state} map."""
    timeline: dict[int, dict[str, Any]] = {}

    for _, play in game_df.iterrows():
        game_secs = play["game_seconds_remaining"]
        if pd.isna(game_secs):
            continue

        wall_min = _game_seconds_to_wall_minute(float(game_secs))
        wall_min = max(GAME_START_MINUTE, min(_GAME_END_MINUTE, wall_min))

        clock_str = _format_clock(play["time"])
        clock_parts = clock_str.split(":")
        clock_secs = (
            int(clock_parts[0]) * 60 + int(clock_parts[1])
            if len(clock_parts) == 2 else 900
        )

        state: dict[str, Any] = {
            "quarter": int(play["qtr"]) if not pd.isna(play["qtr"]) else None,
            "clock": clock_str,
            "clock_seconds_remaining": clock_secs,
            "home": int(play["total_home_score"]) if not pd.isna(play["total_home_score"]) else 0,
            "away": int(play["total_away_score"]) if not pd.isna(play["total_away_score"]) else 0,
            "play": _summarise_play(play["desc"]),
        }
        state["score_diff"] = state["home"] - state["away"]

        timeline[wall_min] = state

    return timeline


def load_nfl_game_states() -> dict[str, dict[int, dict[str, Any] | None]]:
    """Load all three scenario games and return full 1 440-minute state maps.

    Returns ``{scenario_id: {minute: game_state_or_None}}`` where minutes
    outside the game window are ``None``.
    """
    df = pd.read_csv(NFL_CSV, usecols=_COLS, encoding="utf-8-sig")
    result: dict[str, dict[int, dict[str, Any] | None]] = {}

    for scenario_id, game_id in GAME_MAPPING.items():
        game_df = (
            df[df["game_id"] == game_id]
            .sort_values("game_seconds_remaining", ascending=False)
        )
        if game_df.empty:
            print(f"  WARNING: game_id {game_id} not found in CSV")
            result[scenario_id] = {m: None for m in range(1440)}
            continue

        away_team = game_df.iloc[0]["away_team"]
        game_timeline = _build_game_timeline(game_df)

        full: dict[int, dict[str, Any] | None] = {}
        last_state: dict[str, Any] | None = None
        for minute in range(1440):
            if minute in game_timeline:
                last_state = game_timeline[minute]
            if minute < GAME_START_MINUTE or minute > _GAME_END_MINUTE:
                full[minute] = None
            elif last_state is not None:
                full[minute] = last_state
            else:
                full[minute] = {
                    "quarter": 1, "clock": "15:00",
                    "home": 0, "away": 0, "score_diff": 0,
                    "play": "Pre-game",
                }
            full[minute]  # ensure key exists
        result[scenario_id] = full

        final = game_df.iloc[-1]
        home_final = int(final["total_home_score"]) if not pd.isna(final["total_home_score"]) else "?"
        away_final = int(final["total_away_score"]) if not pd.isna(final["total_away_score"]) else "?"
        print(f"  {scenario_id}: SEA {home_final} - {away_final} {away_team} "
              f"({len(game_timeline)} play-minutes mapped)")

    return result


if __name__ == "__main__":
    print("Loading NFL play-by-play data …")
    states = load_nfl_game_states()
    for sid, timeline in states.items():
        game_minutes = sum(1 for v in timeline.values() if v is not None)
        print(f"  {sid}: {game_minutes} minutes with game state")

        for m in [1110, 1140, 1175, 1195, 1230, 1260]:
            st = timeline.get(m)
            if st:
                h, mm = divmod(m, 60)
                print(f"    min {m} ({h:02d}:{mm:02d}) → Q{st['quarter']} {st['clock']} "
                      f"SEA {st['home']}-{st['away']} | {st['play'][:60]}")
