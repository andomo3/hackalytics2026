"""Export stadium-area Link stations and optional post-game departures to JSON.

Reads mainData/stops.txt and mainData/stop_times.txt, filters to the four
Link stations near Lumen Field (Stadium, SODO, King Street, Int'l Dist),
writes backend/data/link_stations.json and backend/data/stadium_departures.json.

Run from project root or backend:
  python -m scripts.export_link_stations
  cd backend && python -m scripts.export_link_stations
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# backend/scripts/export_link_stations.py -> backend -> project root
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

MAINDATA = PROJECT_ROOT / "mainData"
STOPS_PATH = MAINDATA / "stops.txt"
STOP_TIMES_PATH = MAINDATA / "stop_times.txt"
OUTPUT_DIR = BACKEND_DIR / "data"
LINK_STATIONS_JSON = OUTPUT_DIR / "link_stations.json"
STADIUM_DEPARTURES_JSON = OUTPUT_DIR / "stadium_departures.json"

# GTFS stop_ids for the four stations we want (parent/station level)
STADIUM_AREA_STOP_IDS = {"C13", "C15", "C09", "SS01"}
# Platform stop_ids for Stadium (for departure lookup)
STADIUM_PLATFORM_IDS = {"99101", "99260"}


def _normalize_time(hhmmss: str) -> int:
    """Convert HH:MM:SS to minutes since midnight. Handles 24:xx and 25:xx."""
    parts = hhmmss.strip().split(":")
    if len(parts) < 2:
        return -1
    h, m = int(parts[0]), int(parts[1])
    s = int(parts[2]) if len(parts) > 2 else 0
    if h >= 24:
        h -= 24
    return h * 60 + m + (1 if s >= 30 else 0)


def export_stations() -> list[dict]:
    """Load stops.txt, filter to stadium-area Link stations, return list of dicts."""
    if not STOPS_PATH.exists():
        print(f"Missing {STOPS_PATH}", file=sys.stderr)
        return []

    rows = []
    with open(STOPS_PATH, encoding="utf-8") as f:
        f.readline()  # skip CSV header
        for line in f:
            # Simple CSV split (no quoted commas in our columns)
            parts = line.strip().split(",")
            if len(parts) < 4:
                continue
            stop_id = parts[0].strip()
            if stop_id not in STADIUM_AREA_STOP_IDS:
                continue
            stop_name = parts[1].strip() if len(parts) > 1 else ""
            try:
                lat = float(parts[2])
                lon = float(parts[3])
            except (ValueError, IndexError):
                continue
            rows.append({
                "id": stop_id,
                "name": stop_name,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
            })

    # Sort by name for stable output
    rows.sort(key=lambda x: x["name"])
    return rows


def export_stadium_departures() -> list[str]:
    """Load stop_times.txt, filter to Stadium platforms, 21:00-22:00, return sorted HH:MM list."""
    if not STOP_TIMES_PATH.exists():
        return []

    start_min = 21 * 60
    end_min = 22 * 60
    times_seen: set[int] = set()

    with open(STOP_TIMES_PATH, encoding="utf-8") as f:
        header = f.readline()
        for line in f:
            parts = line.strip().split(",")
            if len(parts) < 5:
                continue
            stop_id = parts[1].strip()
            if stop_id not in STADIUM_PLATFORM_IDS:
                continue
            dep = parts[3].strip()
            min_of_day = _normalize_time(dep)
            if min_of_day < 0:
                continue
            if start_min <= min_of_day < end_min:
                times_seen.add(min_of_day)

    out = []
    for m in sorted(times_seen):
        out.append(f"{m // 60:02d}:{m % 60:02d}")
    return out


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    stations = export_stations()
    with open(LINK_STATIONS_JSON, "w", encoding="utf-8") as f:
        json.dump(stations, f, indent=2)
    print(f"Wrote {len(stations)} stations to {LINK_STATIONS_JSON}")

    departures = export_stadium_departures()
    with open(STADIUM_DEPARTURES_JSON, "w", encoding="utf-8") as f:
        json.dump(departures, f, indent=2)
    print(f"Wrote {len(departures)} Stadium departures (21:00-22:00) to {STADIUM_DEPARTURES_JSON}")


if __name__ == "__main__":
    main()
