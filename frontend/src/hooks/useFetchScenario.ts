import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  findMockScenarioById,
  GameState,
  Hotspot,
  mockScenarioMetadata,
  ScenarioData,
  ScenarioMetadata,
  scenarios as mockScenarios,
  TimelineMinute,
} from '../components/mockData';

type ApiScenarioMetadata = {
  id?: string;
  label?: string;
  date?: string;
  teams?: string;
  attendance?: number;
  profile_type?: string;
};

type ApiTimelineMinute = {
  minute?: number;
  transit_load?: Record<string, number> | null;
  pedestrian_volume?: Record<string, number> | null;
  game_state?: Record<string, unknown> | null;
  egress_threat_score?: number | null;
  threat_score?: number | null;
  estimated_crowd_volume?: number | null;
  predicted_surge_velocity?: number | null;
  critical_capacity_threshold?: number | null;
  platform_utilization_pct?: number | null;
  transit_status?: Record<string, string> | null;
  danger_routes?: unknown;
  safe_routes?: unknown;
  emergency_corridors?: unknown;
  ai_log_lines?: string[] | null;
  alert_message?: string | null;
  severity?: number | null;
  time_label?: string | null;
  timestamp_label?: string | null;
};

type ApiScenarioTimeseries = {
  scenario_id?: string;
  metadata?: ApiScenarioMetadata;
  timeline?: ApiTimelineMinute[];
};

export type ScenarioDataSource = 'api' | 'mock';

export type AlertLogEntry = {
  minute: number;
  timeLabel: string;
  message: string;
  severity: number;
};

export type UseFetchScenarioResult = {
  scenarioOptions: ScenarioMetadata[];
  simulationData: ScenarioData;
  isLoading: boolean;
  error: string | null;
  dataSource: ScenarioDataSource;
  refresh: () => void;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:8000';
const LUMEN_FIELD: [number, number] = [47.5952, -122.3316];
const STATION_COORDS: Record<string, [number, number]> = {
  stadium_station: [47.598, -122.33],
  king_street: [47.599, -122.328],
  king_street_station: [47.599, -122.328],
  sodo_station: [47.592, -122.328],
  occidental_ave: [47.5958, -122.333],
  first_ave_s: [47.5968, -122.3322],
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
  const min = minute % 60;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

function toRiskLevel(profileType?: string): string {
  const profile = (profileType ?? '').toLowerCase();
  if (profile.includes('blowout')) {
    return 'HIGH';
  }
  if (profile.includes('high') || profile.includes('close')) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function toSeverity(threatScore: number): number {
  if (threatScore >= 0.85) {
    return 5;
  }
  if (threatScore >= 0.7) {
    return 4;
  }
  if (threatScore >= 0.5) {
    return 3;
  }
  if (threatScore >= 0.3) {
    return 2;
  }
  return 1;
}

function toDefaultAlert(threatScore: number): string {
  if (threatScore >= 0.85) {
    return 'CRITICAL: Crowd crush risk elevated. Activate rerouting.';
  }
  if (threatScore >= 0.7) {
    return 'HIGH RISK: Early egress wave detected.';
  }
  if (threatScore >= 0.5) {
    return 'ELEVATED: Monitor station capacity and queue growth.';
  }
  if (threatScore >= 0.3) {
    return 'Monitoring crowd movement.';
  }
  return 'ALL SYSTEMS NORMAL';
}

function normalizeScenarioMetadata(metadata: ApiScenarioMetadata): ScenarioMetadata {
  const id = metadata.id ?? 'scenario_a_normal_exit';
  const name = metadata.label ?? 'Scenario';
  const description = metadata.teams
    ? `${metadata.teams} on ${metadata.date ?? 'scheduled date'}`
    : 'Pre-configured scenario timeline';
  return {
    id,
    name,
    attendance: asNumber(metadata.attendance, 0),
    description,
    risk_level: toRiskLevel(metadata.profile_type),
    date: metadata.date,
    teams: metadata.teams,
    profile_type: metadata.profile_type,
  };
}

function normalizeCoordinatePair(pair: unknown): [number, number] | null {
  if (!Array.isArray(pair) || pair.length < 2) {
    return null;
  }
  const lat = asNumber(pair[0], NaN);
  const lng = asNumber(pair[1], NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return [lat, lng];
}

function normalizeRoutes(rawRoutes: unknown): number[][][] {
  if (!Array.isArray(rawRoutes)) {
    return [];
  }

  const routes: number[][][] = [];
  for (const route of rawRoutes) {
    const routeValue =
      Array.isArray(route)
        ? route
        : typeof route === 'object' && route !== null
        ? ((route as Record<string, unknown>).path ??
            (route as Record<string, unknown>).coordinates ??
            (route as Record<string, unknown>).route)
        : null;

    if (!Array.isArray(routeValue)) {
      continue;
    }

    const normalizedPath = routeValue
      .map((point) => normalizeCoordinatePair(point))
      .filter((point): point is [number, number] => point !== null);

    if (normalizedPath.length >= 2) {
      routes.push(normalizedPath);
    }
  }

  return routes;
}

function stationLabel(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function fallbackCoords(locationId: string): [number, number] {
  return STATION_COORDS[locationId] ?? [47.5952, -122.3316];
}

function buildHotspots(
  transitLoad: Record<string, number>,
  threatScore: number
): Hotspot[] {
  const hotspots: Hotspot[] = Object.entries(transitLoad)
    .map(([locationId, load]) => {
      const [lat, lng] = fallbackCoords(locationId);
      const density = Math.min(120, Math.round((load / 1800) * 100));
      if (density < 50) {
        return null;
      }

      const status: Hotspot['status'] =
        density > 95 ? 'CRITICAL' : density > 75 ? 'ELEVATED' : 'NORMAL';

      return {
        id: locationId,
        name: stationLabel(locationId),
        lat,
        lng,
        density_pct: density,
        status,
        forecasted_density: Math.min(120, Math.round(density + threatScore * 12)),
        recommended_action:
          status === 'CRITICAL'
            ? 'Reroute to alternate station immediately'
            : status === 'ELEVATED'
            ? 'Monitor and stagger flow'
            : 'Normal operations',
      };
    })
    .filter((hotspot): hotspot is Hotspot => hotspot !== null);

  if (hotspots.length > 0) {
    return hotspots;
  }

  if (threatScore >= 0.75) {
    return [
      {
        id: 'stadium_station',
        name: 'Stadium Station',
        lat: 47.598,
        lng: -122.33,
        density_pct: Math.round(90 + threatScore * 20),
        status: threatScore >= 0.85 ? 'CRITICAL' : 'ELEVATED',
        forecasted_density: Math.round(100 + threatScore * 10),
        recommended_action: 'Route toward King Street and SODO corridors',
      },
    ];
  }

  return [];
}

function buildBlurbs(
  transitLoad: Record<string, number>,
  hotspots: Hotspot[]
): Array<{ lat: number; lng: number; text: string }> {
  const fromTransit = Object.entries(transitLoad)
    .filter(([, load]) => load > 1200)
    .slice(0, 2)
    .map(([locationId, load]) => {
      const [lat, lng] = fallbackCoords(locationId);
      return {
        lat,
        lng,
        text: `${stationLabel(locationId)}: ${Math.round((load / 1800) * 100)}% Capacity`,
      };
    });

  if (fromTransit.length > 0) {
    return fromTransit;
  }

  return hotspots.slice(0, 2).map((hotspot) => ({
    lat: hotspot.lat,
    lng: hotspot.lng,
    text: `${hotspot.name}: ${hotspot.density_pct}% Capacity`,
  }));
}

function normalizeGameState(rawState: Record<string, unknown> | null | undefined): GameState {
  if (!rawState) {
    return { home: 0, away: 0, clock: '15:00', qtr: 1 };
  }

  return {
    home: asNumber(rawState.home, 0),
    away: asNumber(rawState.away, 0),
    clock: typeof rawState.clock === 'string' ? rawState.clock : '15:00',
    qtr: asNumber(rawState.qtr ?? rawState.quarter, 1),
  };
}

function normalizeTimelineMinute(rawMinute: ApiTimelineMinute): TimelineMinute {
  const minute = Math.max(0, Math.min(1439, asNumber(rawMinute.minute, 0)));
  const threatScore = Math.max(
    0,
    Math.min(1, asNumber(rawMinute.threat_score ?? rawMinute.egress_threat_score, 0))
  );
  const severity = asNumber(rawMinute.severity, toSeverity(threatScore));
  const transitLoad = (rawMinute.transit_load ?? {}) as Record<string, number>;
  const pedestrianVolume = (rawMinute.pedestrian_volume ?? {}) as Record<string, number>;

  const dangerRoutes = normalizeRoutes(rawMinute.danger_routes);
  const safeRoutes = normalizeRoutes(rawMinute.safe_routes);
  const emergencyCorridors = normalizeRoutes(rawMinute.emergency_corridors);

  const hotSpots = buildHotspots(transitLoad, threatScore);
  const blurbs = buildBlurbs(transitLoad, hotSpots);

  const resolvedDangerRoutes =
    dangerRoutes.length > 0 || threatScore < 0.7
      ? dangerRoutes
      : [[[LUMEN_FIELD[0], LUMEN_FIELD[1]], [47.598, -122.33]]];
  const resolvedSafeRoutes =
    safeRoutes.length > 0 || threatScore < 0.5
      ? safeRoutes
      : [[[LUMEN_FIELD[0], LUMEN_FIELD[1]], [47.599, -122.328]]];

  return {
    minute,
    time_label:
      rawMinute.time_label ??
      rawMinute.timestamp_label ??
      minuteToLabel(minute),
    timestamp_label: rawMinute.timestamp_label ?? rawMinute.time_label ?? minuteToLabel(minute),
    game_state: normalizeGameState(rawMinute.game_state),
    threat_score: threatScore,
    alert_message: rawMinute.alert_message?.trim() || toDefaultAlert(threatScore),
    danger_routes: resolvedDangerRoutes,
    safe_routes: resolvedSafeRoutes,
    emergency_corridors: emergencyCorridors,
    transit_status: (rawMinute.transit_status ?? {}) as Record<string, string>,
    ai_log_lines: rawMinute.ai_log_lines ?? [],
    blurbs,
    hotspots: hotSpots,
    severity,
    estimated_crowd_volume: asNumber(rawMinute.estimated_crowd_volume, 0),
    predicted_surge_velocity: asNumber(
      rawMinute.predicted_surge_velocity,
      Math.round(25 + threatScore * 150)
    ),
    critical_capacity_threshold: asNumber(rawMinute.critical_capacity_threshold, 133),
    platform_utilization_pct: asNumber(
      rawMinute.platform_utilization_pct,
      Math.round((asNumber(rawMinute.predicted_surge_velocity, 25 + threatScore * 150) / 133) * 100)
    ),
    transit_load: transitLoad,
    pedestrian_volume: pedestrianVolume,
  };
}

function normalizeScenarioData(payload: ApiScenarioTimeseries): ScenarioData {
  const metadata = normalizeScenarioMetadata(payload.metadata ?? {});
  const rawTimeline = Array.isArray(payload.timeline) ? payload.timeline : [];
  const normalizedTimeline = rawTimeline.map((minute) => normalizeTimelineMinute(minute));

  if (normalizedTimeline.length === 1440) {
    return { scenario_metadata: metadata, timeline: normalizedTimeline };
  }

  const fallback = findMockScenarioById(metadata.id);
  return {
    scenario_metadata: metadata,
    timeline: fallback.timeline.map((minute) => ({ ...minute })),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export function useFetchScenario(selectedScenarioId: string | null): UseFetchScenarioResult {
  const [scenarioOptions, setScenarioOptions] = useState<ScenarioMetadata[]>(mockScenarioMetadata);
  const [simulationData, setSimulationData] = useState<ScenarioData>(mockScenarios[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<ScenarioDataSource>('mock');
  const [refreshToken, setRefreshToken] = useState(0);

  const effectiveScenarioId = useMemo(() => {
    if (selectedScenarioId) {
      return selectedScenarioId;
    }
    return scenarioOptions[0]?.id ?? mockScenarioMetadata[0].id;
  }, [selectedScenarioId, scenarioOptions]);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadScenarioOptions = async () => {
      try {
        const apiScenarios = await fetchJson<ApiScenarioMetadata[]>(`${API_BASE_URL}/api/scenarios`);
        if (isCancelled || !Array.isArray(apiScenarios) || apiScenarios.length === 0) {
          return;
        }

        setScenarioOptions(apiScenarios.map((scenario) => normalizeScenarioMetadata(scenario)));
        setDataSource('api');
        setError(null);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }
        setDataSource('mock');
        setError(loadError instanceof Error ? loadError.message : 'Failed to load scenarios');
      }
    };

    void loadScenarioOptions();
    return () => {
      isCancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    let isCancelled = false;

    const selectedScenarioMetadata = scenarioOptions.find(
      (scenario) => scenario.id === effectiveScenarioId
    );

    const fallbackScenario = findMockScenarioById(effectiveScenarioId);
    const fallbackData: ScenarioData = {
      scenario_metadata: {
        ...fallbackScenario.scenario_metadata,
        ...(selectedScenarioMetadata ?? {}),
      },
      timeline: fallbackScenario.timeline.map((minute) => ({ ...minute })),
    };

    const loadScenarioTimeseries = async () => {
      setIsLoading(true);

      try {
        const payload = await fetchJson<ApiScenarioTimeseries>(
          `${API_BASE_URL}/api/scenarios/${effectiveScenarioId}/timeseries`
        );
        if (isCancelled) {
          return;
        }

        const normalized = normalizeScenarioData(payload);
        setSimulationData(normalized);
        setDataSource('api');
        setError(null);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        setSimulationData(fallbackData);
        setDataSource('mock');
        setError(loadError instanceof Error ? loadError.message : 'Failed to load timeline data');
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadScenarioTimeseries();
    return () => {
      isCancelled = true;
    };
  }, [effectiveScenarioId, scenarioOptions, refreshToken]);

  return {
    scenarioOptions,
    simulationData,
    isLoading,
    error,
    dataSource,
    refresh,
  };
}
