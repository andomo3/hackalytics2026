export type { GameState, Hotspot, TimelineMinute, ScenarioMetadata, ScenarioData } from './types';
import type { GameState, Hotspot, TimelineMinute, ScenarioMetadata, ScenarioData } from './types';

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
    
    const hotspots = generateHotspots(i, scenarioType, isGameTime, isPostGame);
    
    timeline.push({
      minute: i,
      time_label,
      game_state,
      threat_score,
      alert_message,
      danger_routes,
      safe_routes,
      blurbs,
      hotspots
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
