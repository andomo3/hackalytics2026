# SafeTransit

Predictive crowd-safety platform for the Seattle 2026 World Cup stress-test scenarios.

## Stack

- Backend: FastAPI + SQLAlchemy (async) + SQLite
- Frontend: React + Vite + Tailwind + Leaflet
- Infra: Docker Compose

## Quick Start (Docker)

```powershell
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Health check: `http://localhost:8000/healthz`

## Local Development

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd ..
cd frontend
npm install
npm run dev
```

## Environment Variables

Use `.env.example` as the template for `.env`.

- `OPENAI_API_KEY`
- `SOCRATA_APP_TOKEN`
- `NFL_DATA_DIR`
- `DATABASE_URL`
- `BACKEND_CORS_ORIGINS`

## Data Safety

- Do not commit raw NFL CSVs larger than GitHub limits.
- Keep all inference precomputed into SQLite for zero-latency demo playback.
