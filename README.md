# CROWDSHIELD

## Predictive Crisis Triage and Agentic Safety for Mega-Events

**Track:** Best AI for Human Safety (Hacklytics 2026)

![React Badge](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Python Badge](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI Badge](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![Docker Badge](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![OpenAI Badge](https://img.shields.io/badge/OpenAI-Agentic-412991?logo=openai&logoColor=white)

CrowdShield is a predictive command center for crowd safety during mega-events. It combines sports momentum signals, transit pressure, Monte Carlo tail-risk simulation, and type-safe agentic routing to intervene before crush conditions emerge.

## Problem vs Solution

### The Problem
US mega-event mobility is fragile, especially in car-centric metro systems where rail platforms and arterial roads saturate quickly after a trigger event. Two life-safety risks dominate:

- **Transit Platform Crushes:** A sudden fan exodus overwhelms station processing rates and creates high-density crush conditions.
- **Golden Hour Gridlock:** First responder movement is delayed when emergency corridors are blocked by mass pedestrian and vehicle spillover.

### The Solution
CrowdShield fuses **sports telemetry (NFL play-by-play)** and **municipal transit load profiles** to estimate minute-level **Surge Velocity** (people/minute arriving at transit nodes). Instead of reacting after a surge begins, dispatch operations can intervene earlier:

- detect high-risk egress patterns before seats empty,
- lock down unsafe nodes,
- redirect flow to safer corridors,
- clear EMS paths to protect response time.

In the blowout scenario, this creates roughly a 20-minute decision window before peak crush conditions.

## System Architecture and the Agentic Stack

### 1) Dual-Stream Data Pipeline
- **Transit stream:** Seattle traffic/transit signals are ingested into `transit_cache`.
- **Game stream:** NFL play-by-play is normalized into minute-level game state.
- **Persistence:** All scenario minutes are precomputed into SQLite for zero-latency playback.

### 2) Prediction Engine
- XGBoost-based egress prediction estimates baseline threat and crowd volume.
- Monte Carlo simulation (`10,000` draws/minute) computes p95 worst-case **predicted_surge_velocity**.
- Blowout dynamics are amplified when home deficit and quarter conditions indicate early mass departure.

### 3) Agentic Orchestrator (Pydantic AI)
- Pydantic-typed output (`RoutingPayload`) constrains route IDs, message, and severity.
- Agent routing selects from approved corridors only; invalid or overlapping routes are rejected.
- Timeline export merges routing with intervention fields such as `transit_status` and `emergency_corridors`.

### 4) Tactical Frontend
- Custom hybrid renderer: **HTML5 canvas** + absolute HTML overlays.
- Seattle district basemap is drawn in-canvas (Elliott Bay, I-5 corridor, road/rail primitives).
- Neon tactical overlays: safe (emerald), danger (red dashed), EMS (blue + pulsing white).
- 24-hour scrubber runs at interactive speed against pre-cached timeline data.

## 3-Day Stress Test (Demo Flow)

- **Scenario A: Normal Game**
  - Smooth ingress/egress bell curve, no critical interventions.
- **Scenario B: High Volume / Close Game**
  - Elevated load and congestion, but still below hard safety threshold.
- **Scenario C: Q3 Blowout**
  - Home side down by 28 points in Q3; surge velocity spikes, Stadium Station is locked down, and EMS corridor routing is activated.

## Quick Start (Docker, Recommended for Judges)

### Prerequisites
- Docker Desktop
- Git

### 1) Configure environment
```powershell
Copy-Item .env.example .env
```

Set CORS/API values in `.env` (important for local browser ports):
```env
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
VITE_API_BASE_URL=http://localhost:8000
```

### 2) Place trained model (optional but recommended)
Put `egress_model.joblib` in one of:
- `exports/egress_model.joblib` (recommended)
- `backend/app/ml/egress_model.joblib`

Or set:
```env
EGRESS_MODEL_PATH=C:\full\path\to\egress_model.joblib
```

### 3) Build precomputed demo artifacts
```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-demo-pipeline.ps1
```

This generates:
- `exports/scenario_c_timeline.json`
- `frontend/public/data/scenario_c_timeline.json`

### 4) Run stack
```powershell
docker compose up --build
```

### 5) Open apps
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/healthz`

## Local Development (Without Docker)

### Backend
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

For local Vite (`5173`), keep `BACKEND_CORS_ORIGINS` including `http://localhost:5173`.

## Key API Endpoints
- `GET /healthz`
- `GET /api/scenarios`
- `GET /api/scenarios/{scenario_id}/timeseries`

## Zero-Latency Demo Design
All expensive processing is moved offline:
- ETL + ML + routing precompute in backend pipeline
- Monte Carlo p95 timeline export to JSON
- Frontend reads minute-indexed timeline and renders instantly during scrub

This ensures smooth demo playback under hackathon conditions.

## Repository Layout
- `backend/` FastAPI, ETL, ML, AI orchestration, SQLite
- `frontend/` React tactical UI, canvas map renderer, timeline controls
- `exports/` generated datasets and precomputed timeline artifacts
- `scripts/` reproducible pipeline runners
- `docs/` supporting project documents

## License
For hackathon demonstration and educational use.
