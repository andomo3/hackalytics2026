import { useEffect, useState } from 'react';
import { ScenarioData, TimelineMinute } from '../components/mockData';

type DemoTimelineResult = {
  data: ScenarioData | null;
  loading: boolean;
  error: string | null;
};

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function minuteToLabel(minute: number): string {
  const hour = Math.floor(minute / 60);
  const mins = minute % 60;
  return `${hour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function normalizeRouteCollection(routes: unknown): number[][][] {
  if (!Array.isArray(routes)) {
    return [];
  }
  const out: number[][][] = [];
  for (const route of routes) {
    if (!Array.isArray(route)) {
      continue;
    }
    const path: number[][] = [];
    for (const point of route) {
      if (
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
      ) {
        path.push([Number(point[0]), Number(point[1])]);
      }
    }
    if (path.length >= 2) {
      out.push(path);
    }
  }
  return out;
}

function normalizeTimelineFrame(rawFrame: Record<string, unknown>, index: number): TimelineMinute {
  const minute = Math.max(0, Math.min(1439, asNumber(rawFrame.minute, index)));
  const threatScore = Math.max(
    0,
    Math.min(
      1,
      asNumber(
        rawFrame.threat_score ?? rawFrame.egress_threat_score,
        0
      )
    )
  );

  return {
    minute,
    time_label:
      (rawFrame.time_label as string | undefined) ??
      (rawFrame.timestamp_label as string | undefined) ??
      minuteToLabel(minute),
    timestamp_label:
      (rawFrame.timestamp_label as string | undefined) ??
      (rawFrame.time_label as string | undefined) ??
      minuteToLabel(minute),
    game_state: (rawFrame.game_state as TimelineMinute['game_state']) ?? {
      home: 0,
      away: 0,
      clock: '15:00',
      qtr: 1,
    },
    threat_score: threatScore,
    alert_message: (rawFrame.alert_message as string | undefined) ?? 'ALL SYSTEMS NORMAL',
    danger_routes: normalizeRouteCollection(rawFrame.danger_routes),
    safe_routes: normalizeRouteCollection(rawFrame.safe_routes),
    emergency_corridors: normalizeRouteCollection(rawFrame.emergency_corridors),
    blurbs: (rawFrame.blurbs as TimelineMinute['blurbs']) ?? [],
    hotspots: (rawFrame.hotspots as TimelineMinute['hotspots']) ?? [],
    intersections: (rawFrame.intersections as TimelineMinute['intersections']) ?? [],
    severity: asNumber(rawFrame.severity, threatScore >= 0.85 ? 5 : 1),
    estimated_crowd_volume: asNumber(rawFrame.estimated_crowd_volume, Math.round(threatScore * 68000)),
    predicted_surge_velocity: asNumber(rawFrame.predicted_surge_velocity, Math.round(30 + threatScore * 140)),
    critical_capacity_threshold: asNumber(rawFrame.critical_capacity_threshold, 133),
    platform_utilization_pct: asNumber(
      rawFrame.platform_utilization_pct,
      Math.round((asNumber(rawFrame.predicted_surge_velocity, Math.round(30 + threatScore * 140)) / 133) * 100)
    ),
    transit_status: (rawFrame.transit_status as TimelineMinute['transit_status']) ?? {
      stadium_station: 'OPEN',
      king_st: 'OPEN',
    },
    ai_log_lines: (rawFrame.ai_log_lines as string[] | undefined) ?? [],
    transit_load: (rawFrame.transit_load as Record<string, number> | undefined) ?? {},
    pedestrian_volume: (rawFrame.pedestrian_volume as Record<string, number> | undefined) ?? {},
  };
}

export function useDemoTimeline(enabled: boolean): DemoTimelineResult {
  const [data, setData] = useState<ScenarioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/data/scenario_c_timeline.json', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load demo timeline (${response.status})`);
        }
        const payload = (await response.json()) as Record<string, unknown>;
        if (cancelled) {
          return;
        }
        const rawTimeline = Array.isArray(payload.timeline) ? payload.timeline : [];
        const normalizedTimeline = rawTimeline.map((frame, idx) =>
          normalizeTimelineFrame(frame as Record<string, unknown>, idx)
        );
        setData({
          scenario_metadata: {
            id: 'blowout_scenario_c',
            name: 'Scenario C: Q3 Blowout & Medical Emergency',
            attendance: 68740,
            description: 'Precomputed demo timeline with Monte Carlo surge simulation',
            risk_level: 'HIGH',
            ...(payload.scenario_metadata as object),
          },
          timeline: normalizedTimeline,
        });
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load demo timeline');
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { data, loading, error };
}

