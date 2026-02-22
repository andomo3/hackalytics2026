// Mock data following the SafeTransit data contract
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

export interface TransitStatus {
  stadium_station?: string;
  king_st?: string;
  [key: string]: string | undefined;
}

export interface Intersection {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heat: number;            // 0-100: simulated busyness percentage
  flow_direction: string;  // e.g. "N", "SE", "W"
  threat_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  crowd_estimate: number;  // estimated pedestrians at this intersection
  ai_recommendation: string;
}

export interface TimelineMinute {
  minute: number;
  time_label: string;
  timestamp_label?: string;
  game_state: GameState;
  threat_score: number;
  alert_message: string;
  danger_routes: number[][][];
  safe_routes: number[][][];
  blurbs: Array<{ lat: number; lng: number; text: string }>;
  hotspots: Hotspot[];
  intersections: Intersection[];
  severity?: number;
  estimated_crowd_volume?: number;
  predicted_surge_velocity?: number;
  critical_capacity_threshold?: number;
  platform_utilization_pct?: number;
  transit_status?: TransitStatus;
  emergency_corridors?: number[][][];
  ai_log_lines?: string[];
  transit_load?: Record<string, number>;
  pedestrian_volume?: Record<string, number>;
}

export interface ScenarioMetadata {
  id: string;
  name: string;
  attendance: number;
  description: string;
  risk_level: string;
  date?: string;
  teams?: string;
  profile_type?: string;
}

export interface ScenarioData {
  scenario_metadata: ScenarioMetadata;
  timeline: TimelineMinute[];
}

// ====== Intersection Grid ======
// Real Seattle intersections within ~1 mile of Lumen Field (47.5952, -122.3316)
// Each has a distance tier: 'near' (< 0.3mi), 'mid' (0.3-0.6mi), 'far' (0.6-1mi)
// and a primary flow direction based on its position relative to the stadium.
const INTERSECTION_DEFS: Array<{
  id: string;
  name: string;
  lat: number;
  lng: number;
  tier: 'near' | 'mid' | 'far';
  flowDir: string;
}> = [
  // NEAR tier -- immediately around Lumen Field
  { id: 'int_01', name: 'S Royal Brougham & Occidental', lat: 47.5934, lng: -122.3327, tier: 'near', flowDir: 'S' },
  { id: 'int_02', name: '1st Ave S & S King St', lat: 47.5981, lng: -122.3340, tier: 'near', flowDir: 'N' },
  { id: 'int_03', name: 'Occidental Ave S & S Atlantic St', lat: 47.5918, lng: -122.3328, tier: 'near', flowDir: 'S' },
  { id: 'int_04', name: '1st Ave S & S Royal Brougham', lat: 47.5936, lng: -122.3346, tier: 'near', flowDir: 'W' },
  { id: 'int_05', name: 'Edgar Martinez Dr & Occidental', lat: 47.5910, lng: -122.3323, tier: 'near', flowDir: 'SE' },
  { id: 'int_06', name: '4th Ave S & S Royal Brougham', lat: 47.5940, lng: -122.3290, tier: 'near', flowDir: 'E' },
  { id: 'int_07', name: 'S King St & 2nd Ave S', lat: 47.5985, lng: -122.3310, tier: 'near', flowDir: 'N' },
  { id: 'int_08', name: 'Airport Way S & S Royal Brougham', lat: 47.5937, lng: -122.3265, tier: 'near', flowDir: 'E' },
  { id: 'int_09', name: 'Occidental Ave S & S Dearborn', lat: 47.5960, lng: -122.3330, tier: 'near', flowDir: 'NW' },
  { id: 'int_10', name: '3rd Ave S & S King St', lat: 47.5983, lng: -122.3295, tier: 'near', flowDir: 'NE' },

  // MID tier -- within 0.3-0.6 miles
  { id: 'int_11', name: '1st Ave S & S Jackson St', lat: 47.5993, lng: -122.3345, tier: 'mid', flowDir: 'N' },
  { id: 'int_12', name: '4th Ave S & S Jackson St', lat: 47.5995, lng: -122.3280, tier: 'mid', flowDir: 'NE' },
  { id: 'int_13', name: 'S Lander St & 1st Ave S', lat: 47.5880, lng: -122.3340, tier: 'mid', flowDir: 'SW' },
  { id: 'int_14', name: 'Alaskan Way S & S King St', lat: 47.5982, lng: -122.3380, tier: 'mid', flowDir: 'NW' },
  { id: 'int_15', name: '6th Ave S & S Royal Brougham', lat: 47.5942, lng: -122.3250, tier: 'mid', flowDir: 'E' },
  { id: 'int_16', name: 'S Holgate St & 1st Ave S', lat: 47.5898, lng: -122.3340, tier: 'mid', flowDir: 'S' },
  { id: 'int_17', name: '2nd Ave S & S Jackson St', lat: 47.5993, lng: -122.3320, tier: 'mid', flowDir: 'N' },
  { id: 'int_18', name: 'Utah Ave S & S Royal Brougham', lat: 47.5939, lng: -122.3230, tier: 'mid', flowDir: 'E' },
  { id: 'int_19', name: 'Occidental Ave S & S Holgate', lat: 47.5895, lng: -122.3325, tier: 'mid', flowDir: 'S' },
  { id: 'int_20', name: '4th Ave S & S Dearborn St', lat: 47.5965, lng: -122.3288, tier: 'mid', flowDir: 'NE' },
  { id: 'int_21', name: 'Alaskan Way S & S Atlantic', lat: 47.5920, lng: -122.3380, tier: 'mid', flowDir: 'W' },
  { id: 'int_22', name: 'Rainier Ave S & S Dearborn', lat: 47.5961, lng: -122.3220, tier: 'mid', flowDir: 'E' },
  { id: 'int_23', name: 'Maynard Ave S & S King St', lat: 47.5987, lng: -122.3260, tier: 'mid', flowDir: 'NE' },
  { id: 'int_24', name: '1st Ave S & S Stacy St', lat: 47.5903, lng: -122.3342, tier: 'mid', flowDir: 'S' },
  { id: 'int_25', name: '3rd Ave S & S Holgate St', lat: 47.5897, lng: -122.3300, tier: 'mid', flowDir: 'SE' },

  // FAR tier -- 0.6-1 mile radius
  { id: 'int_26', name: 'James St & 2nd Ave', lat: 47.6025, lng: -122.3330, tier: 'far', flowDir: 'N' },
  { id: 'int_27', name: 'Yesler Way & 1st Ave', lat: 47.6015, lng: -122.3350, tier: 'far', flowDir: 'N' },
  { id: 'int_28', name: 'S Lander St & Airport Way S', lat: 47.5878, lng: -122.3260, tier: 'far', flowDir: 'SE' },
  { id: 'int_29', name: '4th Ave & Cherry St', lat: 47.6043, lng: -122.3295, tier: 'far', flowDir: 'N' },
  { id: 'int_30', name: 'Alaskan Way & Madison St', lat: 47.6040, lng: -122.3385, tier: 'far', flowDir: 'NW' },
  { id: 'int_31', name: 'Rainier Ave S & S Holgate', lat: 47.5893, lng: -122.3210, tier: 'far', flowDir: 'SE' },
  { id: 'int_32', name: '12th Ave S & S Jackson St', lat: 47.5988, lng: -122.3170, tier: 'far', flowDir: 'E' },
  { id: 'int_33', name: 'S Walker St & Rainier Ave S', lat: 47.5863, lng: -122.3215, tier: 'far', flowDir: 'SE' },
  { id: 'int_34', name: '2nd Ave & Columbia St', lat: 47.6030, lng: -122.3340, tier: 'far', flowDir: 'N' },
  { id: 'int_35', name: 'S Forest St & Airport Way S', lat: 47.5855, lng: -122.3255, tier: 'far', flowDir: 'S' },
  { id: 'int_36', name: '5th Ave S & S Jackson St', lat: 47.5995, lng: -122.3260, tier: 'far', flowDir: 'NE' },
  { id: 'int_37', name: 'Alaskan Way S & S Holgate', lat: 47.5893, lng: -122.3385, tier: 'far', flowDir: 'SW' },
  { id: 'int_38', name: 'Yesler Way & 3rd Ave', lat: 47.6013, lng: -122.3315, tier: 'far', flowDir: 'N' },
  { id: 'int_39', name: 'S Michigan St & Rainier Ave', lat: 47.5845, lng: -122.3210, tier: 'far', flowDir: 'SE' },
  { id: 'int_40', name: '1st Ave & Cherry St', lat: 47.6045, lng: -122.3370, tier: 'far', flowDir: 'NW' },
];

// Seeded PRNG for deterministic per-intersection variation
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Generate intersection heat values for a given minute and scenario */
function generateIntersections(
  minute: number,
  scenarioType: 'normal' | 'high_attendance' | 'blowout'
): Intersection[] {
  const isPreGame = minute >= 1020 && minute < 1080;
  const isGameTime = minute >= 1080 && minute < 1260;
  const isPostGame = minute >= 1260 && minute < 1380;
  const isActive = isPreGame || isGameTime || isPostGame;

  // Base multiplier by scenario
  const scenarioMult = scenarioType === 'blowout' ? 1.3 : scenarioType === 'high_attendance' ? 1.15 : 1.0;

  // Time-based intensity curve
  let timeIntensity = 0;
  if (isPreGame) {
    timeIntensity = 0.3 + ((minute - 1020) / 60) * 0.4; // ramps 0.3 -> 0.7
  } else if (isGameTime) {
    const gameMin = minute - 1080;
    timeIntensity = 0.5 + (gameMin / 180) * 0.3; // 0.5 -> 0.8
    // Blowout Q3 spike
    if (scenarioType === 'blowout' && gameMin >= 90 && gameMin <= 150) {
      timeIntensity = 0.95;
    }
  } else if (isPostGame) {
    const postMin = minute - 1260;
    timeIntensity = 0.9 - (postMin / 120) * 0.6; // 0.9 -> 0.3
    // Blowout post-game is more intense early
    if (scenarioType === 'blowout' && postMin < 30) {
      timeIntensity = 1.0;
    }
  } else {
    // Off-hours: baseline urban traffic
    const hour = Math.floor(minute / 60);
    if (hour >= 7 && hour <= 9) timeIntensity = 0.15; // morning commute
    else if (hour >= 16 && hour <= 18) timeIntensity = 0.2; // evening commute
    else timeIntensity = 0.05;
  }

  // Tier multipliers: near intersections get more traffic
  const tierMult: Record<string, number> = { near: 1.0, mid: 0.65, far: 0.35 };

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  return INTERSECTION_DEFS.map((def, idx) => {
    const variation = seededRandom(minute * 100 + idx) * 0.25; // 0-25% noise
    const rawHeat = timeIntensity * scenarioMult * tierMult[def.tier] * (0.75 + variation);
    const heat = Math.round(Math.min(100, Math.max(0, rawHeat * 100)));
    const crowdEstimate = Math.round(heat * (isActive ? 12 : 3) * (def.tier === 'near' ? 1.5 : def.tier === 'mid' ? 1.0 : 0.6));

    let threat_level: Intersection['threat_level'] = 'LOW';
    if (heat >= 85) threat_level = 'CRITICAL';
    else if (heat >= 65) threat_level = 'HIGH';
    else if (heat >= 40) threat_level = 'MODERATE';

    // AI recommendation based on state
    let ai_recommendation = 'Normal flow. No action needed.';
    if (threat_level === 'CRITICAL') {
      ai_recommendation = 'Reroute pedestrians. Deploy crowd control.';
    } else if (threat_level === 'HIGH') {
      ai_recommendation = 'Monitor closely. Prepare alternate routes.';
    } else if (threat_level === 'MODERATE') {
      ai_recommendation = 'Elevated activity. Continue monitoring.';
    }

    // Slightly randomize flow direction during active periods
    const flowDir = isActive
      ? (seededRandom(minute * 50 + idx * 7) > 0.7 ? directions[Math.floor(seededRandom(minute * 33 + idx) * 8)] : def.flowDir)
      : def.flowDir;

    return {
      id: def.id,
      name: def.name,
      lat: def.lat,
      lng: def.lng,
      heat,
      flow_direction: flowDir,
      threat_level,
      crowd_estimate: crowdEstimate,
      ai_recommendation,
    };
  });
}

// Generate timeline data for a full 24 hours (1440 minutes)
function generateTimeline(scenarioType: 'normal' | 'high_attendance' | 'blowout'): TimelineMinute[] {
  const timeline: TimelineMinute[] = [];
  
  // Base coordinates for Lumen Field and surrounding stations
  const lumenField = [47.5952, -122.3316];
  const stadiumStation = [47.5980, -122.3300];
  const kingStreetStation = [47.5990, -122.3280];
  const soDoStation = [47.5920, -122.3280];
  const westlakeStation = [47.6110, -122.3370];
  
  // Helper function to generate hotspots based on timeline moment and scenario
  const generateHotspots = (minute: number, scenarioType: string, isGameTime: boolean, isPostGame: boolean): Hotspot[] => {
    const hotspots: Hotspot[] = [];
    const gameMinute = minute - 1080;
    
    // Stadium Station
    let stadiumDensity = 20;
    if (isGameTime) {
      stadiumDensity = 45 + (gameMinute / 180) * 30; // Increases during game
      if (scenarioType === 'blowout' && gameMinute >= 90) {
        stadiumDensity = 110; // Critical during blowout
      } else if (scenarioType === 'high_attendance') {
        stadiumDensity = 95;
      }
    } else if (isPostGame) {
      stadiumDensity = 85 - ((minute - 1260) / 120) * 40; // Decreases after game
    }
    
    if (stadiumDensity > 50) {
      hotspots.push({
        id: 'stadium_station',
        name: 'Stadium Station',
        lat: 47.5980,
        lng: -122.3300,
        density_pct: Math.round(stadiumDensity),
        status: stadiumDensity > 90 ? 'CRITICAL' : stadiumDensity > 70 ? 'ELEVATED' : 'NORMAL',
        forecasted_density: Math.min(120, Math.round(stadiumDensity + 10)),
        recommended_action: stadiumDensity > 90 ? 'AVOID - Use King St Station' : 'Monitor capacity'
      });
    }
    
    // King Street Station
    let kingStDensity = 15;
    if (isGameTime) {
      kingStDensity = 30 + (gameMinute / 180) * 20;
      if (scenarioType === 'blowout' && gameMinute >= 90) {
        kingStDensity = 65; // More traffic due to rerouting
      } else if (scenarioType === 'high_attendance') {
        kingStDensity = 55;
      }
    } else if (isPostGame) {
      kingStDensity = 60 - ((minute - 1260) / 120) * 30;
    }
    
    if (kingStDensity > 50) {
      hotspots.push({
        id: 'king_st_station',
        name: 'King St Station',
        lat: 47.5990,
        lng: -122.3280,
        density_pct: Math.round(kingStDensity),
        status: kingStDensity > 90 ? 'CRITICAL' : kingStDensity > 70 ? 'ELEVATED' : 'NORMAL',
        forecasted_density: Math.round(kingStDensity + 5),
        recommended_action: kingStDensity > 70 ? 'High traffic expected' : 'Available capacity'
      });
    }
    
    // SoDo Station
    let soDoDensity = 10;
    if (isPostGame && scenarioType !== 'blowout') {
      soDoDensity = 55 + Math.random() * 15;
    }
    
    if (soDoDensity > 50) {
      hotspots.push({
        id: 'sodo_station',
        name: 'SoDo Station',
        lat: 47.5920,
        lng: -122.3280,
        density_pct: Math.round(soDoDensity),
        status: soDoDensity > 90 ? 'CRITICAL' : soDoDensity > 70 ? 'ELEVATED' : 'NORMAL',
        forecasted_density: Math.round(soDoDensity - 5),
        recommended_action: 'Alternate route available'
      });
    }
    
    // Westlake Station (only active during high traffic)
    let westlakeDensity = 5;
    if (isPostGame && scenarioType === 'high_attendance') {
      westlakeDensity = 60 + Math.random() * 10;
    }
    
    if (westlakeDensity > 50) {
      hotspots.push({
        id: 'westlake_station',
        name: 'Westlake Station',
        lat: 47.6110,
        lng: -122.3370,
        density_pct: Math.round(westlakeDensity),
        status: westlakeDensity > 90 ? 'CRITICAL' : westlakeDensity > 70 ? 'ELEVATED' : 'NORMAL',
        forecasted_density: Math.round(westlakeDensity - 8),
        recommended_action: 'Northbound traffic increasing'
      });
    }
    
    return hotspots;
  };
  
  for (let i = 0; i < 1440; i++) {
    const hour = Math.floor(i / 60);
    const minute = i % 60;
    const time_label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Game typically happens around 18:00-21:00 (1080-1260 minutes)
    const isPreGame = i >= 1020 && i < 1080; // 17:00-18:00
    const isGameTime = i >= 1080 && i < 1260; // 18:00-21:00
    const isPostGame = i >= 1260 && i < 1380; // 21:00-23:00
    
    let threat_score = 0.1;
    let alert_message = 'ALL SYSTEMS NORMAL';
    let danger_routes: number[][][] = [];
    let safe_routes: number[][][] = [];
    let blurbs: Array<{ lat: number; lng: number; text: string }> = [];
    let game_state: GameState = { home: 0, away: 0, clock: '15:00', qtr: 1 };
    
    if (isGameTime) {
      const gameMinute = i - 1080;
      const quarter = Math.min(4, Math.floor(gameMinute / 45) + 1);
      const qtrClock = 15 - Math.floor((gameMinute % 45) / 3);
      game_state = {
        home: 0,
        away: 0,
        clock: `${qtrClock}:${((gameMinute % 3) * 20).toString().padStart(2, '0')}`,
        qtr: quarter
      };
      
      if (scenarioType === 'normal') {
        game_state.home = Math.min(21, Math.floor(gameMinute / 8));
        game_state.away = Math.min(17, Math.floor(gameMinute / 10));
        threat_score = 0.3;
        alert_message = 'NOMINAL CROWD FLOW';
        safe_routes = [[lumenField, stadiumStation]];
      } else if (scenarioType === 'high_attendance') {
        game_state.home = Math.min(28, Math.floor(gameMinute / 6));
        game_state.away = Math.min(24, Math.floor(gameMinute / 7));
        threat_score = 0.65;
        alert_message = 'ELEVATED CROWD DENSITY - MONITORING';
        danger_routes = [[lumenField, stadiumStation]];
        safe_routes = [[lumenField, kingStreetStation]];
        blurbs = [
          { lat: 47.5980, lng: -122.3300, text: 'Stadium Station: 95% Capacity' }
        ];
      } else if (scenarioType === 'blowout') {
        // Blowout scenario - score diverges heavily by Q3
        if (quarter <= 2) {
          game_state.home = Math.min(14, Math.floor(gameMinute / 10));
          game_state.away = Math.min(21, Math.floor(gameMinute / 6));
          threat_score = 0.4;
          alert_message = 'MONITORING SCORE DIFFERENTIAL';
        } else if (quarter === 3 && gameMinute >= 90) {
          // Critical moment: Q3, big score gap, early egress predicted
          game_state.home = 14;
          game_state.away = 42;
          threat_score = 0.88;
          alert_message = 'CRITICAL: Mass egress predicted. Stadium Station at capacity. Rerouting to King St.';
          danger_routes = [
            [lumenField, stadiumStation],
            [stadiumStation, soDoStation]
          ];
          safe_routes = [
            [lumenField, kingStreetStation],
            [lumenField, westlakeStation]
          ];
          blurbs = [
            { lat: 47.5980, lng: -122.3300, text: 'Platform Crush Risk: HIGH (110% Cap)' },
            { lat: 47.5990, lng: -122.3280, text: 'King St: OPEN - Route Here' }
          ];
        } else {
          game_state.home = 14;
          game_state.away = Math.min(42, 28 + Math.floor((gameMinute - 90) / 3));
          threat_score = 0.75;
          alert_message = 'HIGH RISK: Early departure wave detected';
          danger_routes = [[lumenField, stadiumStation]];
          safe_routes = [[lumenField, kingStreetStation]];
          blurbs = [
            { lat: 47.5980, lng: -122.3300, text: 'Stadium Station: 102% Capacity' }
          ];
        }
      }
    } else if (isPreGame) {
      threat_score = 0.25;
      alert_message = 'PRE-GAME INGRESS - NORMAL FLOW';
      safe_routes = [[lumenField, stadiumStation]];
    } else if (isPostGame) {
      threat_score = 0.5;
      alert_message = 'POST-GAME EGRESS - ELEVATED TRAFFIC';
      if (scenarioType === 'blowout') {
        danger_routes = [[lumenField, stadiumStation]];
        safe_routes = [[lumenField, kingStreetStation]];
      } else {
        safe_routes = [[lumenField, stadiumStation]];
      }
    }
    
    let predicted_surge_velocity = Math.round(25 + threat_score * 155);
    const critical_capacity_threshold = 133;
    let platform_utilization_pct = Math.round((predicted_surge_velocity / critical_capacity_threshold) * 100);
    let transit_status: TransitStatus = {
      stadium_station: platform_utilization_pct >= 110 ? 'LOCKED_DOWN' : 'OPEN',
      king_st: 'OPEN',
    };
    let emergency_corridors: number[][][] =
      transit_status.stadium_station === 'LOCKED_DOWN'
        ? [[[47.6044, -122.3238], [47.6019, -122.3258], [47.5994, -122.3282], [47.5972, -122.3299], [47.5952, -122.3316]]]
        : [];
    let ai_log_lines =
      transit_status.stadium_station === 'LOCKED_DOWN'
        ? [
            'THREAT EXCEEDS PLATFORM LIMIT.',
            'EXECUTING STATION LOCKDOWN.',
            'MAPPING EMS CORRIDORS.',
          ]
        : [
            'MONITORING CORRIDOR FLOW.',
            'CAPACITY WITHIN SAFE LIMITS.',
            'NO INTERVENTION REQUIRED.',
          ];

    if (scenarioType === 'blowout' && i === 1125) {
      game_state = { home: 14, away: 42, clock: '6:12', qtr: 3 };
      threat_score = 0.95;
      alert_message =
        'CRITICAL: Surge velocity exceeds platform limit. Medical emergency flagged near Lumen Field.';
      predicted_surge_velocity = 186;
      platform_utilization_pct = Math.round((predicted_surge_velocity / critical_capacity_threshold) * 100);
      transit_status = { stadium_station: 'LOCKED_DOWN', king_st: 'OPEN' };
      emergency_corridors = [
        [[47.6044, -122.3238], [47.6019, -122.3258], [47.5994, -122.3282], [47.5972, -122.3299], [47.5952, -122.3316]],
      ];
      ai_log_lines = [
        'THREAT EXCEEDS PLATFORM LIMIT.',
        'EXECUTING STATION LOCKDOWN.',
        'MAPPING EMS CORRIDORS.',
      ];
      danger_routes = [[lumenField, stadiumStation]];
      safe_routes = [
        [lumenField, kingStreetStation],
        [lumenField, westlakeStation],
      ];
      blurbs = [
        { lat: 47.5980, lng: -122.3300, text: '[ X - STATION CLOSED ] Crush Risk Detected.' },
        { lat: 47.5990, lng: -122.3280, text: 'King St OPEN - Route Here.' },
      ];
    }

    const hotspots = generateHotspots(i, scenarioType, isGameTime, isPostGame);
    const intersections = generateIntersections(i, scenarioType);

    timeline.push({
      minute: i,
      time_label,
      timestamp_label: time_label,
      game_state,
      threat_score,
      alert_message,
      danger_routes,
      safe_routes,
      blurbs,
      hotspots,
      intersections,
      predicted_surge_velocity,
      critical_capacity_threshold,
      platform_utilization_pct,
      transit_status,
      emergency_corridors,
      ai_log_lines,
      estimated_crowd_volume: Math.round(threat_score * 68000),
      severity: threat_score >= 0.85 ? 5 : threat_score >= 0.7 ? 4 : threat_score >= 0.5 ? 3 : threat_score >= 0.3 ? 2 : 1,
    });
  }
  
  return timeline;
}

export const scenarios: ScenarioData[] = [
  {
    scenario_metadata: {
      id: 'normal_a',
      name: 'Group Stage (Normal)',
      attendance: 62500,
      description: 'Standard World Cup match with expected crowd flow patterns',
      risk_level: 'LOW'
    },
    timeline: generateTimeline('normal')
  },
  {
    scenario_metadata: {
      id: 'high_attendance_b',
      name: 'Quarter-Final (High Volume)',
      attendance: 68740,
      description: 'High-stakes match with maximum attendance and close score',
      risk_level: 'MEDIUM'
    },
    timeline: generateTimeline('high_attendance')
  },
  {
    scenario_metadata: {
      id: 'blowout_c',
      name: 'Scenario C: Q3 Blowout',
      attendance: 68740,
      description: 'One-sided match triggering early mass egress in Q3',
      risk_level: 'HIGH'
    },
    timeline: generateTimeline('blowout')
  }
];

export const mockScenarioMetadata: ScenarioMetadata[] = scenarios.map(
  (scenario) => scenario.scenario_metadata
);

export function findMockScenarioById(scenarioId: string): ScenarioData {
  const exactMatch = scenarios.find(
    (scenario) => scenario.scenario_metadata.id === scenarioId
  );
  if (exactMatch) {
    return exactMatch;
  }

  const lowered = scenarioId.toLowerCase();
  if (lowered.includes('blowout') || lowered.includes('scenario_c') || lowered.includes('_c')) {
    return scenarios[2];
  }
  if (
    lowered.includes('high') ||
    lowered.includes('close') ||
    lowered.includes('quarter') ||
    lowered.includes('scenario_b') ||
    lowered.includes('_b')
  ) {
    return scenarios[1];
  }
  return scenarios[0];
}
