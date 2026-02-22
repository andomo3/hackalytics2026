from __future__ import annotations

from typing import Any


SCENARIOS: dict[str, dict[str, Any]] = {
    "scenario_a_normal_exit": {
        "id": "scenario_a_normal_exit",
        "label": "Scenario A: Normal Exit",
        "date": "2026-06-15",
        "teams": "SEA 24-13 DAL",
        "attendance": 59000,
        "profile_type": "normal_exit",
        "description": "Group stage match — comfortable home win. Moderate pregame arrival, orderly postgame dispersal across all corridors.",
        "key_minute": 1265,
        "narrative": "A routine game day: fans arrive steadily over 2 hours, the home side wins convincingly, and the crowd exits in a predictable wave. Corridors return to baseline within 60 minutes of the final whistle.",
    },
    "scenario_b_close_game": {
        "id": "scenario_b_close_game",
        "label": "Scenario B: Close Game",
        "date": "2026-06-20",
        "teams": "SEA 40-38 HOU",
        "attendance": 68000,
        "profile_type": "high_attendance_close_game",
        "description": "Quarter-final sell-out — nail-biter decided by 2 points. Massive simultaneous egress as 68K fans leave at once.",
        "key_minute": 1265,
        "narrative": "Full stadium, full tension. Nobody leaves early in a 2-point game. When the final whistle blows all 68,000 fans flood the corridors simultaneously, creating the highest sustained congestion of any scenario.",
    },
    "scenario_c_blowout_q3": {
        "id": "scenario_c_blowout_q3",
        "label": "Scenario C: Blowout",
        "date": "2026-06-25",
        "teams": "SEA 7-42 LA",
        "attendance": 68000,
        "profile_type": "blowout_q3_home_losing_21plus",
        "description": "Quarter-final sell-out — home side down 0-34 at half. Mass early exodus begins in Q3, creating an extended congestion window.",
        "key_minute": 1205,
        "narrative": "The worst-case egress pattern. Fans begin leaving mid-Q3 as the deficit becomes insurmountable, but a residual crowd stays until the end. This produces two overlapping egress waves and the longest total period of elevated corridor saturation.",
    },
}


def get_scenarios() -> list[dict[str, Any]]:
    return list(SCENARIOS.values())


def get_scenario(scenario_id: str) -> dict[str, Any] | None:
    return SCENARIOS.get(scenario_id)
