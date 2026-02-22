"""Offline pre-computation pipeline.

Runs the full ETL → ML → AI pipeline and populates all three database tables
(transit_cache, predictions, routing_decisions) for every scenario.  After this
script completes the API can serve everything from cache with zero latency.

Usage:
    cd backend && ../venv/bin/python3 -m scripts.precompute
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

# Ensure the backend package is importable when run via ``python -m scripts.precompute``
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import delete, select  # noqa: E402

from app.ai.orchestrator import EgressContext, build_routing_decision_async  # noqa: E402
from app.db.models import Predictions, RoutingDecisions, TransitCache  # noqa: E402
from app.db.session import AsyncSessionLocal, init_db  # noqa: E402
from app.etl.nfl_data import load_nfl_game_states  # noqa: E402
from app.etl.scenarios import SCENARIOS  # noqa: E402
from app.etl.seattle_data import ingest_seattle_traffic_data  # noqa: E402
from app.ml.predictor import predict_egress_threat  # noqa: E402

ROUTES_PATH = Path(__file__).resolve().parents[1] / "data" / "geojson_routes" / "routes.json"
ROUTING_THREAT_THRESHOLD = 0.5


def _banner(text: str) -> None:
    print(f"\n{'=' * 60}\n{text}\n{'=' * 60}")


async def precompute_all() -> None:
    await init_db()

    # ------------------------------------------------------------------
    # Step 1 — Traffic ETL  →  transit_cache
    # ------------------------------------------------------------------
    _banner("STEP 1: Seattle Traffic ETL")
    await ingest_seattle_traffic_data()

    # ------------------------------------------------------------------
    # Step 2 — NFL game states (in-memory, no DB write yet)
    # ------------------------------------------------------------------
    _banner("STEP 2: NFL Play-by-Play Loader")
    print("Loading NFL game states …")
    game_states = load_nfl_game_states()

    with open(ROUTES_PATH) as f:
        available_routes: list[dict] = json.load(f)

    # ------------------------------------------------------------------
    # Step 3 — ML predictions + AI routing  →  predictions, routing_decisions
    # ------------------------------------------------------------------
    _banner("STEP 3: ML Predictions + AI Routing Decisions")

    async with AsyncSessionLocal() as session:
        await session.execute(delete(Predictions))
        await session.execute(delete(RoutingDecisions))
        await session.commit()

        for scenario_id in SCENARIOS:
            scenario_states = game_states[scenario_id]
            pred_rows: list[Predictions] = []
            route_rows: list[RoutingDecisions] = []

            # Load transit data for this scenario
            transit_result = await session.execute(
                select(TransitCache).where(TransitCache.scenario_id == scenario_id)
            )
            transit_rows = transit_result.scalars().all()
            transit_by_minute: dict[int, dict[str, dict[str, int]]] = {}
            for row in transit_rows:
                if row.minute not in transit_by_minute:
                    transit_by_minute[row.minute] = {
                        "transit_load": {},
                        "pedestrian_volume": {},
                    }
                transit_by_minute[row.minute]["transit_load"][row.location_id] = row.transit_load
                transit_by_minute[row.minute]["pedestrian_volume"][row.location_id] = row.pedestrian_volume

            for minute in range(1440):
                game_state = scenario_states.get(minute)

                threat, crowd = predict_egress_threat(game_state)

                pred_rows.append(Predictions(
                    scenario_id=scenario_id,
                    minute=minute,
                    egress_threat_score=threat,
                    estimated_crowd_volume=crowd,
                    game_state=game_state,
                ))

                if threat >= ROUTING_THREAT_THRESHOLD:
                    transit_data = transit_by_minute.get(
                        minute,
                        {"transit_load": {}, "pedestrian_volume": {}},
                    )
                    ctx = EgressContext(
                        egress_threat_score=threat,
                        estimated_crowd_volume=crowd,
                        game_state=game_state,
                        transit_loads=transit_data["transit_load"],
                        pedestrian_volume=transit_data["pedestrian_volume"],
                        available_routes=available_routes,
                    )
                    routing = await build_routing_decision_async(ctx)
                    route_rows.append(RoutingDecisions(
                        scenario_id=scenario_id,
                        minute=minute,
                        danger_routes=routing.danger_routes,
                        safe_routes=routing.safe_routes,
                        alert_message=routing.alert_message,
                        severity=routing.severity,
                    ))

            session.add_all(pred_rows)
            session.add_all(route_rows)
            await session.commit()
            print(f"  {scenario_id}: {len(pred_rows):,} predictions, "
                  f"{len(route_rows)} routing decisions")

    _banner("PRE-COMPUTATION COMPLETE")


if __name__ == "__main__":
    asyncio.run(precompute_all())
