import { useState, useEffect, useCallback } from 'react';
import type { ScenarioData, ScenarioMetadata, TimelineMinute, GameState, Hotspot } from '@/components/types';

const CORRIDOR_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
  stadium_1st_ave: { lat: 47.5980, lng: -122.3300, name: '1st Ave S (Stadium)' },
  king_street:     { lat: 47.5990, lng: -122.3280, name: 'King Street' },
  royal_brougham:  { lat: 47.5942, lng: -122.3295, name: 'Royal Brougham' },
  '4th_ave_s':     { lat: 47.5995, lng: -122.3340, name: '4th Ave S' },
  occidental_ave:  { lat: 47.5960, lng: -122.3335, name: 'Occidental Ave' },
  s_atlantic_st:   { lat: 47.5910, lng: -122.3290, name: 'S Atlantic St' },
};

const PEAK_PED_PER_MINUTE: Record<string, number> = {
  stadium_1st_ave: 175,
  king_street:     35,
  royal_brougham:  38,
  '4th_ave_s':     43,
  occidental_ave:  10,
  s_atlantic_st:   30,
};

const RISK_MAP: Record<string, string> = {
  normal_exit:                       'LOW',
  high_attendance_close_game:        'MEDIUM',
  blowout_q3_home_losing_21plus:     'HIGH',
};

function minuteToLabel(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function extractPaths(routes: unknown): number[][][] {
  if (!Array.isArray(routes)) return [];
  return routes
    .map((r: any) => {
      const path = r?.path ?? r;
      return Array.isArray(path) && path.length >= 2 ? path : null;
    })
    .filter((p): p is number[][] => p !== null);
}

function deriveHotspots(
  pedVolume: Record<string, number>,
): Hotspot[] {
  return Object.entries(pedVolume)
    .map(([locId, ped]) => {
      const coord = CORRIDOR_COORDS[locId];
      const peak = PEAK_PED_PER_MINUTE[locId];
      if (!coord || !peak || peak === 0) return null;
      const density = Math.min(120, Math.round((ped / peak) * 100));
      if (density <= 30) return null;
      return {
        id: locId,
        name: coord.name,
        lat: coord.lat,
        lng: coord.lng,
        density_pct: density,
        status: (density > 90 ? 'CRITICAL' : density > 70 ? 'ELEVATED' : 'NORMAL') as Hotspot['status'],
        forecasted_density: Math.min(120, density + 10),
        recommended_action: density > 90 ? 'AVOID — use alternate corridor' : 'Monitor traffic',
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);
}

function deriveBlurbs(hotspots: Hotspot[]): Array<{ lat: number; lng: number; text: string }> {
  return hotspots
    .filter(h => h.status === 'CRITICAL' || h.status === 'ELEVATED')
    .map(h => ({
      lat: h.lat,
      lng: h.lng,
      text: h.status === 'CRITICAL'
        ? `${h.name}: ${h.density_pct}% — AVOID`
        : `${h.name}: ${h.density_pct}% — ELEVATED`,
    }));
}

interface ApiScenarioMeta {
  id: string;
  label: string;
  date: string;
  teams: string;
  attendance: number;
  profile_type: string;
  description?: string;
  key_minute?: number;
  narrative?: string;
}

interface ApiTimelineEntry {
  minute: number;
  transit_load: Record<string, number>;
  pedestrian_volume: Record<string, number>;
  egress_threat_score: number;
  estimated_crowd_volume: number;
  game_state: { quarter?: number; clock?: string; home?: number; away?: number; play?: string } | null;
  danger_routes: unknown;
  safe_routes: unknown;
  alert_message: string | null;
  severity: number | null;
}

function transformTimeline(entries: ApiTimelineEntry[]): TimelineMinute[] {
  return entries.map((t) => {
    const gs: GameState = {
      home: t.game_state?.home ?? 0,
      away: t.game_state?.away ?? 0,
      clock: t.game_state?.clock ?? '0:00',
      qtr: t.game_state?.quarter ?? 0,
    };
    const hotspots = deriveHotspots(t.pedestrian_volume ?? {});
    return {
      minute: t.minute,
      time_label: minuteToLabel(t.minute),
      game_state: gs,
      threat_score: t.egress_threat_score,
      alert_message: t.alert_message ?? 'ALL SYSTEMS NOMINAL',
      danger_routes: extractPaths(t.danger_routes),
      safe_routes: extractPaths(t.safe_routes),
      blurbs: deriveBlurbs(hotspots),
      hotspots,
    };
  });
}

function transformMeta(api: ApiScenarioMeta): ScenarioMetadata {
  return {
    id: api.id,
    name: api.label,
    attendance: api.attendance,
    description: api.description ?? `${api.teams} — ${api.date}`,
    risk_level: RISK_MAP[api.profile_type] ?? 'LOW',
    key_minute: api.key_minute,
    narrative: api.narrative,
  };
}

export type DataSource = 'api' | 'mock';

export function useScenarioData() {
  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<DataSource>('api');

  const loadFromApi = useCallback(async () => {
    const listRes = await fetch('/api/scenarios');
    if (!listRes.ok) throw new Error(`GET /api/scenarios — ${listRes.status}`);
    const scenarioList: ApiScenarioMeta[] = await listRes.json();

    const loaded: ScenarioData[] = await Promise.all(
      scenarioList.map(async (meta) => {
        const tsRes = await fetch(`/api/scenarios/${meta.id}/timeseries`);
        if (!tsRes.ok) throw new Error(`GET /api/scenarios/${meta.id}/timeseries — ${tsRes.status}`);
        const { timeline } = await tsRes.json();
        return {
          scenario_metadata: transformMeta(meta),
          timeline: transformTimeline(timeline),
        };
      }),
    );
    return loaded;
  }, []);

  const loadFromMock = useCallback(async () => {
    const { scenarios: mockScenarios } = await import('../components/mockData');
    return mockScenarios;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = source === 'api' ? await loadFromApi() : await loadFromMock();
        if (!cancelled) setScenarios(data);
      } catch (err: any) {
        console.warn('API fetch failed, falling back to mock data:', err.message);
        try {
          const data = await loadFromMock();
          if (!cancelled) {
            setScenarios(data);
            setSource('mock');
          }
        } catch {
          if (!cancelled) setError('Failed to load scenario data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [source, loadFromApi, loadFromMock]);

  return { scenarios, loading, error, source, setSource };
}
