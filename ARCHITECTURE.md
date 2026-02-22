# ARCHITECTURE

## Overview
CrowdShield is a precomputed safety intelligence system for mega-event crowd management. The runtime architecture is intentionally split into two phases:

1. **Offline compute phase** (ETL, ML, simulation, agent routing, export)
2. **Online playback phase** (FastAPI serving + React tactical rendering)

This design guarantees low-latency response during demo and operations playback.

## 1. End-to-End Pipeline

### 1.1 Dual-Stream Ingestion
- **Transit stream:** Seattle corridor load and pedestrian signals are ingested into `transit_cache`.
- **Game stream:** NFL play-by-play is transformed into minute-level game states.

### 1.2 Precompute Core
`backend/scripts/precompute.py` runs three stages:
- Stage 1: transit ETL -> `transit_cache`
- Stage 2: NFL loader -> minute-indexed game state
- Stage 3: prediction + AI routing -> `predictions`, `routing_decisions`

All 1,440 minutes per scenario are written to SQLite up front.

### 1.3 Demo Artifact Export
`backend/scripts/build_demo_timeline.py` merges DB outputs with simulation and intervention fields, then writes:
- `exports/scenario_c_timeline.json`
- `frontend/public/data/scenario_c_timeline.json`

The frontend can scrub minute `0..1439` with no runtime inference.

## 2. Tactical Frontend Math (Canvas Coordinate Mapping)

The custom map renderer (`frontend/src/components/TacticalMap.tsx`) uses a fixed bounding box for the Seattle stadium district:

- `latMin=47.5830`, `latMax=47.6060`
- `lngMin=-122.3420`, `lngMax=-122.3140`

Coordinate transform (`mapLatLngToPixels`) is linear interpolation:

```text
x = ((lng - lngMin) / (lngMax - lngMin)) * width
y = (1 - (lat - latMin) / (latMax - latMin)) * height
```

This is sufficient because the map footprint is local (Lumen Field to Harborview), so a full projection engine is unnecessary.

### Rendering Layers
1. Basemap vectors (Elliott Bay polygon, I-5 corridor, roads, rail)
2. Tactical route overlays:
   - Safe: solid emerald + glow
   - Danger: red dashed
   - EMS: thick blue + pulsing white siren stroke
3. Intersection heat points
4. HTML overlays for hubs, lock states, hotspots, and labels

The canvas path is optimized for fast redrawing during timeline scrub operations.

## 3. Monte Carlo Surge Simulation (p95 Tail Risk)

Implemented in `backend/app/ml/simulation_engine.py`.

### Input signals per minute
- `egress_threat_score` (or `threat_score`)
- `estimated_crowd_volume`
- `game_state` (`home`, `away`, `qtr`/`quarter`)

### Baseline
A deterministic baseline surge rate is computed from threat and estimated crowd.

### Blowout trigger rule
A minute is considered blowout-sensitive when:

```text
score_diff <= -21 and quarter >= 3
```

(`score_diff = home - away`)

### Momentum amplification
For blowout minutes, the simulation applies an aggressive multiplier (with catalyst emphasis near minute 1125) before sampling.

### Stochastic sampling
- `num_simulations = 10,000` (default)
- Per-minute Gaussian draws around amplified mean
- Clamp to non-negative values
- Extract p95 per minute

Output is `predicted_surge_velocity` (people/minute) used for lock decisions and UI state.

## 4. Agentic Orchestrator and Strict Schema Contract

The AI orchestration layer is in `backend/app/ai/orchestrator.py` with schema in `backend/app/ai/schemas.py`.

### Pydantic contract
`RoutingPayload` enforces type-safe output:
- `danger_routes: list[dict]`
- `safe_routes: list[dict]`
- `alert_message: str`
- `severity: int (1..5)`

### Guardrails
- Route IDs must exist in provided `available_routes`
- A route cannot appear in both danger and safe sets
- Invalid outputs trigger retry (`ModelRetry`)

### Deterministic safety merge
Downstream timeline assembly adds deterministic intervention fields used by UI:
- `transit_status`
- `emergency_corridors`
- `ai_log_lines`
- `critical_capacity_threshold`

This split preserves schema reliability while keeping emergency-state rendering explicit.

## 5. Runtime Data Contract (Minute Frame)

Each timeline minute is normalized to include:
- `minute`, `time_label`, `timestamp_label`
- `game_state`
- `threat_score`
- `predicted_surge_velocity`
- `critical_capacity_threshold`
- `platform_utilization_pct`
- `danger_routes`, `safe_routes`, `emergency_corridors`
- `transit_status`
- `ai_log_lines`
- `hotspots`, `blurbs`

Catalyst behavior is explicitly forced at minute `1125` in the blowout export for deterministic demo playback.

## 6. Performance Strategy

### Offline-first
- ETL, model inference, simulation, and routing are precomputed.
- Frontend consumes static artifact by minute index.

### Online rendering
- Canvas handles heavy geometry and glow effects.
- HTML overlay handles interactivity and readable typography.
- The renderer avoids map SDK overhead and attribution/control DOM churn.

This combination enables smooth 24-hour scrubbing at presentation speed.

## 7. Operational Notes

- Recommended model artifact location: `exports/egress_model.joblib`
- Pipeline runner: `scripts/run-demo-pipeline.ps1`
- Stack startup: `docker compose up --build`
- Frontend/Backend default URLs in compose:
  - Frontend: `http://localhost:3000`
  - Backend: `http://localhost:8000`
