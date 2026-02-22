"""Build static CrowdShield demo timeline with Monte Carlo surge fields.

Usage:
    cd backend
    python -m scripts.build_demo_timeline
"""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Ensure backend package imports resolve when run as module.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.etl.scenarios import get_scenario  # noqa: E402
from app.ml.simulation_engine import CRITICAL_CAPACITY_THRESHOLD, SimulationConfig, simulate_surge_velocity  # noqa: E402

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]
DB_PATH = BACKEND_ROOT / "safetransit.db"
ROUTES_PATH = BACKEND_ROOT / "data" / "geojson_routes" / "routes.json"
EXPORT_PATH = PROJECT_ROOT / "exports" / "scenario_c_timeline.json"
FRONTEND_EXPORT_PATH = PROJECT_ROOT / "frontend" / "public" / "data" / "scenario_c_timeline.json"

HARBORVIEW_TO_LUMEN = [
    [47.6044, -122.3238],  # Harborview Medical Center
    [47.6019, -122.3258],
    [47.5994, -122.3282],
    [47.5972, -122.3299],
    [47.5952, -122.3316],  # Lumen Field
]

AI_LOG_CRITICAL = [
    "THREAT EXCEEDS PLATFORM LIMIT.",
    "EXECUTING STATION LOCKDOWN.",
    "MAPPING EMS CORRIDORS.",
]
AI_LOG_NOMINAL = [
    "MONITORING CORRIDOR FLOW.",
    "CAPACITY WITHIN SAFE LIMITS.",
    "NO INTERVENTION REQUIRED.",
]

STATION_COORDS: dict[str, tuple[float, float]] = {
    "stadium_1st_ave": (47.5980, -122.3300),
    "king_street": (47.5990, -122.3280),
    "royal_brougham": (47.5942, -122.3295),
    "4th_ave_s": (47.5995, -122.3340),
    "occidental_ave": (47.5960, -122.3335),
    "s_atlantic_st": (47.5910, -122.3290),
}


def minute_label(minute: int) -> str:
    hour = minute // 60
    mins = minute % 60
    return f"{hour:02d}:{mins:02d}"


def _parse_json_field(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return None
    return None


def _routes_to_paths(routes: Any) -> list[list[list[float]]]:
    parsed = _parse_json_field(routes)
    if not parsed:
        return []
    if not isinstance(parsed, list):
        return []

    out: list[list[list[float]]] = []
    for route in parsed:
        if isinstance(route, dict) and isinstance(route.get("path"), list):
            path = route["path"]
        elif isinstance(route, list):
            path = route
        else:
            continue
        normalized_path: list[list[float]] = []
        for point in path:
            if (
                isinstance(point, list)
                and len(point) >= 2
                and isinstance(point[0], (int, float))
                and isinstance(point[1], (int, float))
            ):
                normalized_path.append([float(point[0]), float(point[1])])
        if len(normalized_path) >= 2:
            out.append(normalized_path)
    return out


def _load_route_catalog() -> dict[str, list[list[float]]]:
    with open(ROUTES_PATH, encoding="utf-8") as file:
        route_defs = json.load(file)
    catalog: dict[str, list[list[float]]] = {}
    for route in route_defs:
        route_id = route.get("id")
        path = route.get("path")
        if isinstance(route_id, str) and isinstance(path, list):
            catalog[route_id] = path
    return catalog


def _build_hotspots(
    transit_loads: dict[str, int],
    predicted_surge_velocity: int,
    transit_status: dict[str, str],
) -> list[dict[str, Any]]:
    hotspots: list[dict[str, Any]] = []
    for location_id, load in transit_loads.items():
        coords = STATION_COORDS.get(location_id)
        if not coords:
            continue
        density = int(round((load / max(CRITICAL_CAPACITY_THRESHOLD, 1)) * 100))
        if location_id == "stadium_1st_ave" and transit_status.get("stadium_station") == "LOCKED_DOWN":
            density = max(112, density)
        if density < 45:
            continue
        status = "CRITICAL" if density >= 100 else "ELEVATED" if density >= 75 else "NORMAL"
        hotspots.append(
            {
                "id": location_id,
                "name": location_id.replace("_", " ").title(),
                "lat": coords[0],
                "lng": coords[1],
                "density_pct": density,
                "status": status,
                "forecasted_density": min(140, density + 8),
                "recommended_action": (
                    "STATION CLOSED - REROUTE"
                    if status == "CRITICAL"
                    else "Monitor throughput"
                ),
            }
        )

    if transit_status.get("stadium_station") == "LOCKED_DOWN" and not any(
        h["id"] == "stadium_1st_ave" for h in hotspots
    ):
        hotspots.append(
            {
                "id": "stadium_1st_ave",
                "name": "Stadium Station",
                "lat": 47.5980,
                "lng": -122.3300,
                "density_pct": max(112, int(round((predicted_surge_velocity / CRITICAL_CAPACITY_THRESHOLD) * 100))),
                "status": "CRITICAL",
                "forecasted_density": 120,
                "recommended_action": "STATION CLOSED - REROUTE",
            }
        )

    return hotspots


def build_demo_timeline(
    scenario_id: str,
    num_simulations: int,
    random_seed: int,
) -> dict[str, Any]:
    scenario_meta = get_scenario(scenario_id)
    if not scenario_meta:
        raise ValueError(f"Unknown scenario_id: {scenario_id}")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found at {DB_PATH}. Run precompute first.")

    route_catalog = _load_route_catalog()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute(
        """
        SELECT minute, egress_threat_score, estimated_crowd_volume, game_state
        FROM predictions
        WHERE scenario_id = ?
        ORDER BY minute
        """,
        (scenario_id,),
    )
    prediction_rows = cur.fetchall()
    if not prediction_rows:
        conn.close()
        raise RuntimeError(
            "No predictions found for scenario. Run precompute pipeline before export."
        )

    cur.execute(
        """
        SELECT minute, danger_routes, safe_routes, alert_message, severity
        FROM routing_decisions
        WHERE scenario_id = ?
        """,
        (scenario_id,),
    )
    routing_rows = {int(row["minute"]): row for row in cur.fetchall()}

    cur.execute(
        """
        SELECT minute, location_id, transit_load, pedestrian_volume
        FROM transit_cache
        WHERE scenario_id = ?
        """,
        (scenario_id,),
    )
    transit_by_minute: dict[int, dict[str, dict[str, int]]] = {}
    for row in cur.fetchall():
        minute = int(row["minute"])
        minute_bucket = transit_by_minute.setdefault(
            minute, {"transit_load": {}, "pedestrian_volume": {}}
        )
        minute_bucket["transit_load"][row["location_id"]] = int(row["transit_load"] or 0)
        minute_bucket["pedestrian_volume"][row["location_id"]] = int(row["pedestrian_volume"] or 0)

    conn.close()

    base_timeline: list[dict[str, Any]] = []
    for minute in range(1440):
        pred = prediction_rows[minute] if minute < len(prediction_rows) else None
        game_state = _parse_json_field(pred["game_state"]) if pred else None
        if not isinstance(game_state, dict):
            game_state = None
        if game_state and "quarter" in game_state and "qtr" not in game_state:
            game_state["qtr"] = game_state["quarter"]
        if game_state and "qtr" in game_state and "quarter" not in game_state:
            game_state["quarter"] = game_state["qtr"]

        route_row = routing_rows.get(minute)
        transit_row = transit_by_minute.get(minute, {"transit_load": {}, "pedestrian_volume": {}})
        base_timeline.append(
            {
                "minute": minute,
                "time_label": minute_label(minute),
                "egress_threat_score": float(pred["egress_threat_score"] if pred else 0.0),
                "estimated_crowd_volume": int(pred["estimated_crowd_volume"] if pred else 0),
                "game_state": game_state,
                "transit_load": transit_row["transit_load"],
                "pedestrian_volume": transit_row["pedestrian_volume"],
                "danger_routes": _routes_to_paths(route_row["danger_routes"]) if route_row else [],
                "safe_routes": _routes_to_paths(route_row["safe_routes"]) if route_row else [],
                "alert_message": (route_row["alert_message"] if route_row and route_row["alert_message"] else ""),
                "severity": int(route_row["severity"] if route_row and route_row["severity"] is not None else 1),
            }
        )

    surge_curve = simulate_surge_velocity(
        base_timeline,
        config=SimulationConfig(
            num_simulations=num_simulations,
            random_seed=random_seed,
            critical_capacity_threshold=CRITICAL_CAPACITY_THRESHOLD,
        ),
    )

    timeline: list[dict[str, Any]] = []
    for minute, frame in enumerate(base_timeline):
        threat = float(frame["egress_threat_score"])
        predicted_surge = int(surge_curve[minute])
        critical_threshold = CRITICAL_CAPACITY_THRESHOLD

        platform_utilization_pct = int(round((predicted_surge / max(critical_threshold, 1)) * 100))
        lock_down = platform_utilization_pct >= 110 or threat >= 0.92
        transit_status = {
            "stadium_station": "LOCKED_DOWN" if lock_down else "OPEN",
            "king_st": "OPEN",
        }

        danger_routes = frame["danger_routes"] or []
        safe_routes = frame["safe_routes"] or []

        if lock_down:
            if not danger_routes:
                danger_routes = [route_catalog.get("route_stadium_1st_ave", [])]
            if not safe_routes:
                safe_routes = [
                    route_catalog.get("route_king_street", []),
                    route_catalog.get("route_4th_ave_s", []),
                ]
            danger_routes = [r for r in danger_routes if len(r) >= 2]
            safe_routes = [r for r in safe_routes if len(r) >= 2]

        emergency_corridors = [HARBORVIEW_TO_LUMEN] if lock_down else []
        ai_log_lines = AI_LOG_CRITICAL if lock_down else AI_LOG_NOMINAL
        alert_message = frame["alert_message"] or (
            "CRITICAL: Surge velocity exceeds platform limit. Execute reroute."
            if lock_down
            else "Normal operations."
        )

        hotspots = _build_hotspots(frame["transit_load"], predicted_surge, transit_status)
        blurbs: list[dict[str, Any]] = []
        if lock_down:
            blurbs.append(
                {
                    "lat": 47.5980,
                    "lng": -122.3300,
                    "text": "[ X - STATION CLOSED ] Crush Risk Detected.",
                }
            )
            blurbs.append(
                {
                    "lat": 47.5990,
                    "lng": -122.3280,
                    "text": "King St OPEN - Route Here.",
                }
            )

        game_state = frame["game_state"] or {"home": 0, "away": 0, "clock": "15:00", "qtr": 1, "quarter": 1}
        if minute == 1125:
            # Force catalyst frame for deterministic demo storytelling.
            threat = max(threat, 0.95)
            predicted_surge = max(predicted_surge, 186)
            platform_utilization_pct = int(round((predicted_surge / max(critical_threshold, 1)) * 100))
            transit_status = {"stadium_station": "LOCKED_DOWN", "king_st": "OPEN"}
            emergency_corridors = [HARBORVIEW_TO_LUMEN]
            ai_log_lines = AI_LOG_CRITICAL
            game_state = {"home": 14, "away": 42, "clock": "6:12", "qtr": 3, "quarter": 3}
            danger_routes = [route_catalog.get("route_stadium_1st_ave", [])]
            safe_routes = [
                route_catalog.get("route_king_street", []),
                route_catalog.get("route_4th_ave_s", []),
            ]
            danger_routes = [r for r in danger_routes if len(r) >= 2]
            safe_routes = [r for r in safe_routes if len(r) >= 2]
            alert_message = (
                "CRITICAL: Surge velocity exceeds platform limit. Medical emergency "
                "flagged near Lumen Field. Dispatching EMS and locking Stadium Station."
            )
            hotspots = _build_hotspots(frame["transit_load"], predicted_surge, transit_status)
            blurbs = [
                {
                    "lat": 47.5980,
                    "lng": -122.3300,
                    "text": "[ X - STATION CLOSED ] Crush Risk Detected.",
                },
                {
                    "lat": 47.5990,
                    "lng": -122.3280,
                    "text": "King St OPEN - Route Here.",
                },
            ]

        timeline.append(
            {
                "minute": minute,
                "time_label": frame["time_label"],
                "timestamp_label": frame["time_label"],
                "game_state": game_state,
                "threat_score": round(threat, 3),
                "egress_threat_score": round(threat, 3),
                "estimated_crowd_volume": int(frame["estimated_crowd_volume"]),
                "predicted_surge_velocity": int(predicted_surge),
                "critical_capacity_threshold": critical_threshold,
                "platform_utilization_pct": platform_utilization_pct,
                "transit_status": transit_status,
                "danger_routes": danger_routes,
                "safe_routes": safe_routes,
                "emergency_corridors": emergency_corridors,
                "ai_log_lines": ai_log_lines,
                "alert_message": alert_message,
                "severity": max(int(frame["severity"]), 4 if threat >= 0.85 else 1),
                "transit_load": frame["transit_load"],
                "pedestrian_volume": frame["pedestrian_volume"],
                "hotspots": hotspots,
                "blurbs": blurbs,
            }
        )

    metadata = {
        "id": "blowout_scenario_c",
        "name": "Scenario C: Q3 Blowout & Medical Emergency",
        "venue": "Lumen Field, Seattle",
        "source_scenario_id": scenario_meta["id"],
        "source_label": scenario_meta["label"],
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "num_minutes": len(timeline),
        "critical_capacity_threshold": CRITICAL_CAPACITY_THRESHOLD,
    }

    return {"scenario_metadata": metadata, "timeline": timeline}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build static CrowdShield demo timeline JSON.")
    parser.add_argument("--scenario-id", default="scenario_c_blowout_q3")
    parser.add_argument("--num-simulations", type=int, default=10_000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    payload = build_demo_timeline(
        scenario_id=args.scenario_id,
        num_simulations=args.num_simulations,
        random_seed=args.seed,
    )

    EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(EXPORT_PATH, "w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)

    FRONTEND_EXPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(FRONTEND_EXPORT_PATH, "w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)

    print(f"Wrote {EXPORT_PATH}")
    print(f"Wrote {FRONTEND_EXPORT_PATH}")


if __name__ == "__main__":
    main()

