from __future__ import annotations

from collections import defaultdict
from math import sin
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Predictions, RoutingDecisions, TransitCache
from app.db.session import get_db_session
from app.etl.scenarios import get_scenario, get_scenarios

router = APIRouter(tags=["scenarios"])

LUMEN_FIELD = [47.5952, -122.3316]
STADIUM_STATION = [47.5980, -122.3300]
KING_STREET = [47.5990, -122.3280]
SODO_STATION = [47.5920, -122.3280]
WESTLAKE_STATION = [47.6110, -122.3370]


def minute_label(minute: int) -> str:
    hour = minute // 60
    minute_part = minute % 60
    return f"{hour:02d}:{minute_part:02d}"


def score_to_severity(threat_score: float) -> int:
    if threat_score >= 0.85:
        return 5
    if threat_score >= 0.7:
        return 4
    if threat_score >= 0.5:
        return 3
    if threat_score >= 0.3:
        return 2
    return 1


def generate_synthetic_timeline(
    scenario_id: str, scenario: dict[str, Any]
) -> list[dict[str, Any]]:
    timeline: list[dict[str, Any]] = []
    attendance = int(scenario.get("attendance", 68000))
    is_blowout = "blowout" in scenario_id
    is_high = "close" in scenario_id or "high" in scenario_id

    for minute in range(1440):
        game_minute = minute - 1080
        is_pre_game = 1020 <= minute < 1080
        is_game_time = 1080 <= minute < 1260
        is_post_game = 1260 <= minute < 1380

        threat_score = 0.08
        if is_pre_game:
            threat_score = 0.2 if not is_high else 0.3
        elif is_game_time:
            baseline = 0.3 + max(0.0, sin(game_minute / 24.0)) * 0.08
            if is_high:
                baseline += 0.25
            if is_blowout and game_minute >= 90:
                baseline = 0.88
            elif is_blowout and game_minute >= 60:
                baseline = 0.72
            threat_score = min(1.0, baseline)
        elif is_post_game:
            decay = max(0.0, 1.0 - ((minute - 1260) / 120.0))
            post_base = 0.45 if not is_high else 0.6
            threat_score = post_base * decay

        severity = score_to_severity(threat_score)
        estimated_crowd = int(attendance * threat_score)

        transit_load = {
            "stadium_station": int(200 + (threat_score * 1700)),
            "king_street_station": int(120 + max(0.0, threat_score - 0.35) * 1200),
            "sodo_station": int(80 + max(0.0, threat_score - 0.5) * 950),
        }
        pedestrian_volume = {
            "first_ave_s": int(120 + (threat_score * 1200)),
            "occidental_ave": int(90 + (threat_score * 700)),
        }

        game_state: dict[str, Any] | None = None
        if is_game_time:
            quarter = min(4, (game_minute // 45) + 1)
            if is_blowout:
                if game_minute < 90:
                    home_score = min(17, game_minute // 10)
                    away_score = min(28, game_minute // 6)
                else:
                    home_score = 14
                    away_score = 35 + ((game_minute - 90) // 12) * 7
                away_score = min(49, away_score)
            elif is_high:
                home_score = min(31, game_minute // 7)
                away_score = min(28, game_minute // 8)
            else:
                home_score = min(24, game_minute // 9)
                away_score = min(20, game_minute // 10)

            quarter_clock_min = max(0, 15 - ((game_minute % 45) // 3))
            quarter_clock_sec = (game_minute % 3) * 20
            game_state = {
                "home": int(home_score),
                "away": int(away_score),
                "clock": f"{quarter_clock_min}:{quarter_clock_sec:02d}",
                "qtr": int(quarter),
            }

        danger_routes: list[dict[str, Any]] | None = None
        safe_routes: list[dict[str, Any]] | None = None
        alert_message: str | None = None

        if threat_score >= 0.5:
            danger_routes = [
                {"path": [LUMEN_FIELD, STADIUM_STATION], "label": "Stadium corridor overload"}
            ]
            safe_routes = [
                {"path": [LUMEN_FIELD, KING_STREET], "label": "Reroute via King Street"},
                {"path": [LUMEN_FIELD, SODO_STATION], "label": "Secondary via SODO"},
            ]
            if is_blowout and threat_score >= 0.85:
                danger_routes.append(
                    {"path": [STADIUM_STATION, SODO_STATION], "label": "Platform crush risk"}
                )
                safe_routes.append(
                    {"path": [LUMEN_FIELD, WESTLAKE_STATION], "label": "Northbound relief"}
                )

            if threat_score >= 0.85:
                alert_message = (
                    "CRITICAL: Mass egress predicted. Prioritize human safety rerouting now."
                )
            elif threat_score >= 0.7:
                alert_message = (
                    "HIGH RISK: Early departure wave detected. Redirect to alternate corridors."
                )
            else:
                alert_message = (
                    "ELEVATED: Monitoring transit congestion and queue growth."
                )
        else:
            alert_message = "Crowd conditions stable."

        timeline.append(
            {
                "minute": minute,
                "time_label": minute_label(minute),
                "transit_load": transit_load,
                "pedestrian_volume": pedestrian_volume,
                "egress_threat_score": round(threat_score, 3),
                "estimated_crowd_volume": estimated_crowd,
                "game_state": game_state,
                "danger_routes": danger_routes,
                "safe_routes": safe_routes,
                "alert_message": alert_message,
                "severity": severity,
            }
        )

    return timeline


@router.get("/scenarios")
async def list_scenarios() -> list[dict[str, Any]]:
    return get_scenarios()


@router.get("/scenarios/{scenario_id}/timeseries")
async def get_scenario_timeseries(
    scenario_id: str, db: AsyncSession = Depends(get_db_session)
) -> dict[str, Any]:
    scenario = get_scenario(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario_id: {scenario_id}")

    transit_result = await db.execute(
        select(TransitCache).where(TransitCache.scenario_id == scenario_id)
    )
    prediction_result = await db.execute(
        select(Predictions).where(Predictions.scenario_id == scenario_id)
    )
    routing_result = await db.execute(
        select(RoutingDecisions).where(RoutingDecisions.scenario_id == scenario_id)
    )

    transit_rows = transit_result.scalars().all()
    prediction_rows = prediction_result.scalars().all()
    routing_rows = routing_result.scalars().all()

    if not transit_rows and not prediction_rows and not routing_rows:
        return {
            "scenario_id": scenario_id,
            "metadata": scenario,
            "timeline": generate_synthetic_timeline(scenario_id, scenario),
        }

    transit_by_minute: dict[int, dict[str, dict[str, int]]] = defaultdict(
        lambda: {"transit_load": {}, "pedestrian_volume": {}}
    )
    for row in transit_rows:
        minute_bucket = transit_by_minute[row.minute]
        minute_bucket["transit_load"][row.location_id] = row.transit_load
        minute_bucket["pedestrian_volume"][row.location_id] = row.pedestrian_volume

    prediction_by_minute = {row.minute: row for row in prediction_rows}
    routing_by_minute = {row.minute: row for row in routing_rows}

    timeline: list[dict[str, Any]] = []
    for minute in range(1440):
        prediction = prediction_by_minute.get(minute)
        routing = routing_by_minute.get(minute)
        transit_data = transit_by_minute[minute]

        timeline.append(
            {
                "minute": minute,
                "time_label": minute_label(minute),
                "transit_load": transit_data["transit_load"],
                "pedestrian_volume": transit_data["pedestrian_volume"],
                "egress_threat_score": (
                    prediction.egress_threat_score if prediction else 0.0
                ),
                "estimated_crowd_volume": (
                    prediction.estimated_crowd_volume if prediction else 0
                ),
                "game_state": prediction.game_state if prediction else None,
                "danger_routes": routing.danger_routes if routing else None,
                "safe_routes": routing.safe_routes if routing else None,
                "alert_message": routing.alert_message if routing else None,
                "severity": routing.severity if routing else None,
            }
        )

    return {"scenario_id": scenario_id, "metadata": scenario, "timeline": timeline}
