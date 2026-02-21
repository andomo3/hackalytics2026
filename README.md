# SafeTransit

SafeTransit is a full-stack hackathon project for predictive crowd safety at Seattle Lumen Field.

## Project Layout

- `backend/`: FastAPI + SQLAlchemy + SQLite
- `frontend/`: React + Vite + TypeScript (Figma-derived UI)
- `docker-compose.yml`: local full-stack orchestration

## Run With Docker

```powershell
docker compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

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

## Environment

Use `.env.example` as the template for `.env`.
