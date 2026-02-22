export interface GameState {
  home: number;
  away: number;
  clock: string;
  qtr: number;
}

export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  density_pct: number;
  status: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  forecasted_density?: number;
  recommended_action?: string;
}

export interface Intersection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heat: number;
  flow_direction: string;
  threat_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  crowd_estimate: number;
  ai_recommendation: string;
}

export interface TimelineMinute {
  minute: number;
  time_label: string;
  game_state: GameState;
  threat_score: number;
  alert_message: string;
  danger_routes: number[][][];
  safe_routes: number[][][];
  blurbs: Array<{ lat: number; lng: number; text: string }>;
  hotspots: Hotspot[];
  intersections?: Intersection[];
  severity?: number;
  estimated_crowd_volume?: number;
  transit_load?: Record<string, number>;
  pedestrian_volume?: Record<string, number>;
}

export interface ScenarioMetadata {
  id: string;
  name: string;
  attendance: number;
  description: string;
  risk_level: string;
  key_minute?: number;
  narrative?: string;
  date?: string;
  teams?: string;
  profile_type?: string;
}

export interface ScenarioData {
  scenario_metadata: ScenarioMetadata;
  timeline: TimelineMinute[];
}
