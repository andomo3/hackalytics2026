from __future__ import annotations

from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Predictions, RoutingDecisions, TransitCache
from app.db.session import get_db_session
from app.etl.scenarios import get_scenario, get_scenarios

router = APIRouter(tags=["scenarios"])


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
