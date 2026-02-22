#!/bin/sh
set -e

DB_FILE="safetransit.db"

python - <<'PY'
from app.ml.predictor import resolve_model_path, model_search_paths

path = resolve_model_path()
if path:
    print(f"=== Using trained model: {path} ===")
else:
    searched = ", ".join(str(p) for p in model_search_paths())
    print(f"=== No trained model found. Heuristic fallback enabled. Searched: {searched} ===")
PY

if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  echo "=== No database found - running precompute pipeline ==="
  python -m scripts.precompute
  echo "=== Precompute complete ==="
fi

exec uvicorn main:app --host 0.0.0.0 --port 8000
