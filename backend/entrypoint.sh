#!/bin/sh
set -e

DB_FILE="safetransit.db"

if [ ! -f "$DB_FILE" ] || [ ! -s "$DB_FILE" ]; then
  echo "=== No database found - running precompute pipeline ==="
  python -m scripts.precompute
  echo "=== Precompute complete ==="
fi

exec uvicorn main:app --host 0.0.0.0 --port 8000