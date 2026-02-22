---
name: SafeTransit Updated Plan
overview: Updated execution plan for SafeTransit, pivoting from Socrata pedestrian API data to the two local Seattle traffic CSV datasets (2018+ 15-minute bin counts and 2022 traffic flow counts). All other architecture remains the same.
todos:
  - id: traffic-etl
    content: "Build seattle_data.py: load both traffic CSVs, filter to stadium-area locations, generate synthetic 1440-minute timelines per scenario with game-day multipliers, write to transit_cache table"
    status: pending
  - id: nfl-etl
    content: "Build nfl_data.py: load Kaggle NFL play-by-play CSVs, select 3 representative games, build minute-by-minute game state timelines"
    status: pending
  - id: precompute-script
    content: "Create backend/scripts/precompute.py: orchestrate full ETL -> ML -> AI pipeline, populate all 3 DB tables for all 3 scenarios"
    status: pending
  - id: xgboost-training
    content: "Implement ml/train.py: engineer features from traffic + game state, train XGBoost model with synthetic egress labels, save as .joblib. Update predictor.py to use trained model"
    status: pending
  - id: pydantic-ai-agent
    content: "Upgrade ai/orchestrator.py: replace rule-based logic with Pydantic AI agent (OpenAI GPT-4o), generate typed RoutingPayload from game context and traffic data"
    status: pending
  - id: geojson-routes
    content: Expand routes.json from 2 to 5-6 routes covering all major egress corridors around Lumen Field
    status: pending
  - id: frontend-api-integration
    content: Replace mockData.ts with useFetchScenario hook calling backend API. Update labels from pedestrian to traffic/congestion where needed
    status: pending
  - id: end-to-end-polish
    content: Wire up 3-scenario demo narrative, test full slider flow, ensure Docker compose runs precompute on startup
    status: pending
isProject: false
---

# SafeTransit: Updated Execution Plan (Traffic Data Pivot)

## What Changed

The original plan called for **Socrata pedestrian/transit API** data via `sodapy`. You now have two **local traffic CSV datasets** instead:

- `seattle_traffic_counts_2018plus.csv` — 300K rows, 15-minute bin vehicle counts from 447 study locations (2018-2019)
- `2022 Traffic Flow Counts.csv` — 1,930 rows, street-level daily/peak-hour vehicle flow with downtown designations

This eliminates the need for `sodapy`, the `SOCRATA_APP_TOKEN` env var, and any runtime API calls to `data.seattle.gov`. The ETL becomes a pure CSV-to-SQLite pipeline.

## Current State (What's Already Built)

**Backend** — solid scaffold:

- FastAPI app with CORS, health check, lifespan ([backend/main.py](backend/main.py))
- Database models: `TransitCache`, `Predictions`, `RoutingDecisions` ([backend/app/db/models.py](backend/app/db/models.py))
- Async SQLite session ([backend/app/db/session.py](backend/app/db/session.py))
- API routes: `GET /scenarios`, `GET /scenarios/{id}/timeseries` ([backend/app/api/routes.py](backend/app/api/routes.py))
- 3 scenario definitions ([backend/app/etl/scenarios.py](backend/app/etl/scenarios.py))
- Heuristic predictor ([backend/app/ml/predictor.py](backend/app/ml/predictor.py))
- Rule-based routing ([backend/app/ai/orchestrator.py](backend/app/ai/orchestrator.py))
- 2 GeoJSON routes ([backend/data/geojson_routes/routes.json](backend/data/geojson_routes/routes.json))

**Frontend** — fully built with mock data:

- Retro terminal aesthetic with CRT effects
- Canvas-based tactical map, timeline slider, scenario selector, alert panel
- All driven by `mockData.ts` — not connected to backend API

**Stubs/placeholders:**

- `seattle_data.py`, `nfl_data.py`, `train.py` — all empty

## Updated Plan

### Phase 1: Data Pipeline (ETL)

#### 1a. Traffic Data ETL — `etl/seattle_data.py`

Replace the Socrata API ingestion with local CSV loading:

- Load `seattle_traffic_counts_2018plus.csv` (15-min bins)
- Filter to study locations **near Lumen Field** (Stadium District, SODO, Pioneer Square, King Street area) — you'll need to cross-reference `study_id` values with known stadium-area locations, or use the 2022 flow counts dataset which has street names
- Load `2022 Traffic Flow Counts.csv` for street-level context: filter rows where `STNAME_ORD` includes streets near the stadium (1st Ave S, S King St, Occidental Ave, Edgar Martinez Dr, etc.) or `DOWNTOWN` = "B" or "Y"
- For each scenario, build a synthetic 1440-minute timeline by:
  - Using the 15-min bin data as **baseline traffic patterns** (expand each 15-min bin to 15 individual minutes)
  - Applying a **game-day multiplier** during pre-game (2-3x baseline), game time (0.5x as people are inside), and post-game (4-8x baseline for egress surge)
  - The multiplier curves differ per scenario (normal, high-attendance, blowout)
- Write to `transit_cache` table. Rename semantic meaning:
  - `transit_load` = vehicle traffic volume on transit corridors (Stadium Station area, King St, SODO)
  - `pedestrian_volume` = estimated foot traffic (derived as a proportion of vehicle traffic, e.g., 3:1 ratio, or use the 2022 peak-hour data to estimate)

#### 1b. NFL Data Loader — `etl/nfl_data.py`

- Load the NFL play-by-play CSVs from `Kaggle Archive/`
- Select 3 games matching the scenario profiles:
  - Normal exit, close high-attendance game, blowout
- Build minute-by-minute game state: quarter, clock, score differential, play descriptions
- Store as structured data for feature engineering

#### 1c. Pre-computation Script

Create a new `backend/scripts/precompute.py` that runs the full pipeline:

1. Run traffic ETL -> populate `transit_cache`
2. Run NFL data loader -> game timelines
3. Run ML predictions per minute -> populate `predictions`
4. Run AI routing decisions where threat > 0.5 -> populate `routing_decisions`

This script runs once offline. The API then serves purely from cache.

### Phase 2: ML Model

#### 2a. Feature Engineering — `ml/features.py`

Update to incorporate traffic data as features alongside game state:

- Existing: score differential, time pressure, momentum, blowout indicator
- New: **baseline traffic volume** at that minute (from ETL), **traffic surge ratio** (current modeled volume / baseline), **corridor saturation** (volume / capacity estimate)

#### 2b. XGBoost Training — `ml/train.py`

- Training data: combine NFL game states with synthetic egress labels
  - Use game-state heuristics to label threat levels (blowout in Q3 = high threat, normal post-game = medium, mid-game = low)
  - Use traffic baseline as context feature
- Train XGBoost regressor for `egress_threat_score` and `estimated_crowd_volume`
- Save model as `.joblib`
- Upgrade `predictor.py` to load trained model instead of the heuristic

### Phase 3: AI Routing (Pydantic AI)

#### 3a. Orchestrator — `ai/orchestrator.py`

- Replace rule-based logic with Pydantic AI agent using OpenAI GPT-4o
- The agent receives: threat score, crowd volume, game state, current traffic loads per corridor, available GeoJSON routes
- The agent outputs: `RoutingPayload` (danger routes, safe routes, alert message, severity)

#### 3b. Additional GeoJSON Routes

Expand from 2 to 5-6 routes in `routes.json`:

- Lumen Field to Stadium Station (1st Ave S) — currently exists
- Lumen Field to King Street Station — currently exists
- Lumen Field to SODO Station (1st Ave S southbound)
- Occidental Ave pedestrian corridor
- Edgar Martinez Dr to Pioneer Square
- S Royal Brougham Way eastbound

### Phase 4: Frontend Integration

#### 4a. Connect to Backend API

- Replace `mockData.ts` with a `useFetchScenario` hook that calls `GET /api/scenarios/{id}/timeseries`
- Scenario list from `GET /api/scenarios`
- All slider interaction remains client-side on the fetched data block

#### 4b. Label Updates

- Update any UI labels that say "pedestrian" to "traffic" where appropriate
- Ensure the alert panel displays traffic-based metrics (corridor saturation, vehicle volumes)

### Phase 5: Polish

- Ensure all 3 scenarios tell a clear narrative through the timeline
- Docker compose should run precompute script on first startup
- Test the full flow: select scenario -> scrub slider -> see map overlays + alerts

## Dependency Changes

**Remove:** `sodapy` from `requirements.txt`
**Remove:** `SOCRATA_APP_TOKEN` from env config
**Keep everything else** — `pandas` handles CSV loading natively

## Key Risk: Traffic vs. Pedestrian Framing

Since your data is vehicle traffic counts (not pedestrian), you have two framing options:

- **Option A**: Use traffic as a **proxy for pedestrian density** — higher vehicle traffic on surrounding streets correlates with more people moving through the area. Frame it as "corridor congestion" rather than "pedestrian volume."
- **Option B**: Derive estimated pedestrian counts from traffic using a multiplier (e.g., transit ridership estimates). Stadium events have known ratios of transit/walk/drive.

Recommend **Option A** — it's simpler and still tells a compelling safety story about corridor saturation and egress bottlenecks.
