# SafeTransit

Repository documentation and exported datasets have been organized into dedicated directories.

## Directory Highlights

- `docs/`: all project documentation
- `exports/`: data exports and analysis artifacts
- `backend/`: FastAPI + SQLAlchemy + SQLite
- `frontend/`: React + Vite + TypeScript

## Start Here

- Documentation index: `docs/README.md`
- Main plan: `docs/project/execcution_plan.md`
- Frontend overview: `docs/frontend/PROJECT_OVERVIEW.md`

## Run With Docker

```powershell
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

## Optional Trained Model

If you receive `egress_model.joblib` from a teammate, place it in either:

- `backend/app/ml/egress_model.joblib`
- `exports/egress_model.joblib`

Or set an explicit path in `.env`:

```powershell
EGRESS_MODEL_PATH=C:\full\path\to\egress_model.joblib
```

The pipeline auto-detects the model; otherwise it falls back to heuristics.

## Run Locally

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

## Verify Container Consistency

Generate a local environment fingerprint:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-env.ps1
```

Compare against a teammate fingerprint:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-env.ps1 -CompareWith .\artifacts\env-fingerprint-TEAMMATE.json
```
