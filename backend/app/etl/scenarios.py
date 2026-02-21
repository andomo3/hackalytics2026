from __future__ import annotations

from typing import Any


SCENARIOS: dict[str, dict[str, Any]] = {
    "scenario_a_normal_exit": {
        "id": "scenario_a_normal_exit",
        "label": "Scenario A: Normal Exit",
        "date": "2026-06-15",
        "teams": "Matchday Group Stage",
        "attendance": 59000,
        "profile_type": "normal_exit",
    },
    "scenario_b_close_game": {
        "id": "scenario_b_close_game",
        "label": "Scenario B: High Attendance / Close Game",
        "date": "2026-06-20",
        "teams": "Quarter-Final",
        "attendance": 68000,
        "profile_type": "high_attendance_close_game",
    },
    "scenario_c_blowout_q3": {
        "id": "scenario_c_blowout_q3",
        "label": "Scenario C: Blowout",
        "date": "2026-06-25",
        "teams": "Quarter-Final",
        "attendance": 68000,
        "profile_type": "blowout_q3_home_losing_21plus",
    },
}


def get_scenarios() -> list[dict[str, Any]]:
    return list(SCENARIOS.values())


def get_scenario(scenario_id: str) -> dict[str, Any] | None:
    return SCENARIOS.get(scenario_id)
