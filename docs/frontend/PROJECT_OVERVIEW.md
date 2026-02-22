# SafeTransit: Retro Sci-Fi Tactical Command Center

## Project Overview

SafeTransit is a **2D Tactical Command Center** interface designed for the Hacklytics hackathon (Best AI for Human Safety track). The system predicts and prevents crowd crushes during the 2026 World Cup at Seattle's Lumen Field, presented through a **retro sci-fi terminal aesthetic** combining 1980s CRT displays with modern tactical command interfaces.

## Design Philosophy

This project is a **remix** of an existing retro alien flora specimen analysis interface, transformed into a crowd safety monitoring system while retaining the core terminal aesthetic:

### Visual Identity: "Retro Tactical Terminal"
- **Color Palette**: Cyan (#00ffff), Emerald (#10b981), Red (#ef4444), Amber (#f59e0b)
- **Background**: Dark slate/black (#0a0a0a, #0f172a)
- **Typography**: Monospace/Courier New (terminal font)
- **Effects**: CRT scanlines, screen glow, vignette, scanning beams
- **Style**: Glassmorphism panels with heavy backdrop blur

### Core Aesthetic Elements
1. **CRT Monitor Effects**
   - Horizontal scanlines (2px repeating gradient)
   - Animated scanning beam (vertical gradient sweep)
   - Radial screen glow
   - Vignette darkening at edges
   - Corner bracket decorations

2. **Terminal Interface**
   - Monospace fonts throughout
   - Green/cyan text for system messages
   - Red for danger/critical alerts
   - Amber for warnings
   - Pulsing indicators for active systems

3. **Glassmorphism Panels**
   - 80-85% dark background opacity
   - Heavy backdrop blur (20px)
   - Subtle borders (2px solid)
   - Floating/elevated appearance

---

## Architecture

### Component Structure

```
/components/
├── SafeTransitCommand.tsx      # Main container & orchestration
├── ScenarioSelector.tsx        # 3 scenario cards at top
├── TimelineSlider.tsx          # 24-hour scrubber at bottom
├── TacticalMap.tsx             # Canvas-based tactical map
├── AlertPanel.tsx              # Right sidebar with AI reasoning
└── mockData.ts                 # Simulation data (1440 minutes)
```

### App.tsx Integration
The interface is embedded in a **device mockup** (retro gaming device frame):
- Device scales responsively (90vw max width/height)
- UI renders at 500x465px inside device screen
- Screen glow effect animates around display
- Sticky footer with glass morphism and attribution

---

## Features & Functionality

### 1. Scenario Selection
**Component**: `ScenarioSelector.tsx`

Three pre-defined scenarios representing a "3-Day Stress Test":
- **Scenario A**: Group Stage (Normal) - 62,500 attendance, LOW risk
- **Scenario B**: Quarter-Final (High Volume) - 68,740 attendance, MEDIUM risk
- **Scenario C**: Q3 Blowout - 68,740 attendance, HIGH risk (early mass egress)

**Visual Design**:
- 3 cards in horizontal row
- Border color changes based on risk level (green/amber/red)
- Selected card has pulsing border animation
- Corner brackets on each card (retro terminal style)
- Scanline overlay on each card
- Shows attendance and risk level

### 2. Timeline Scrubber
**Component**: `TimelineSlider.tsx`

A full 24-hour timeline (1440 minutes: 00:00 to 23:59):
- **Range slider** with custom styled thumb (cyan/green gradient)
- **Time markers**: 00:00, 06:00, 12:00, 18:00, 23:59
- **Game time indicator**: Highlights 18:00-21:00 (75%-87.5% of timeline)
- **Live readouts**:
  - Current time (HH:MM format)
  - Threat level (NORMAL/ELEVATED/HIGH/CRITICAL)
  - Threat score (0-100%)
- **Pulsing indicator** dot (color matches threat level)

**Key Moments**:
- Game typically runs 18:00-21:00 (minutes 1080-1260)
- Scenario C critical moment: minute 1125 (18:45) - Q3 blowout triggers early egress

### 3. Tactical Map
**Component**: `TacticalMap.tsx`

A **Canvas-based** 2D tactical map (no external dependencies):
- **Grid Background**: Cyan grid lines (20px spacing)
- **Lumen Field**: Marked with cyan circle + outer ring
- **Safe Routes**: Solid green lines with glow effect
- **Danger Routes**: Dashed red lines (10px dash pattern)
- **Marker Blurbs**: Circular indicators with hover popups
  - Red pulsing = High danger (110% capacity)
  - Amber pulsing = Warning/Alert
- **Coordinate Display**: Shows lat/lng at bottom
- **Scanline + Scanning Beam Effects**: Overlays for CRT aesthetic

**Map Coverage**:
- Centered on Lumen Field: 47.5952°N, 122.3316°W
- Bounds: 47.585°-47.615°N, 122.34°-122.32°W
- Key locations:
  - Stadium Station (47.5980, -122.3300)
  - King Street Station (47.5990, -122.3280)
  - SoDo Station (47.5920, -122.3280)

### 4. Alert Panel
**Component**: `AlertPanel.tsx`

Right sidebar (350px wide) showing real-time AI analysis:

**Sections**:
1. **Header**: TACTICAL COMMAND CENTER / SAFETRANSIT v2.0.26
2. **System Time**: Large cyan time display (HH:MM)
3. **Game Status**:
   - Home vs Away score (large bold numbers)
   - Quarter and clock time
   - Score differential (Δ) with color coding
4. **Threat Assessment**:
   - Pulsing status indicator
   - Threat level (NORMAL/ELEVATED/HIGH/CRITICAL)
   - Threat score percentage
   - Visual meter bar
5. **AI Reasoning Log**:
   - Real-time alert messages (e.g., "CRITICAL: Mass egress predicted...")
   - Additional context messages based on threat level
   - Blinking cursor for "live" feel
6. **Stats Grid**: 2x2 grid showing Capacity/Egress/Routes/Status
7. **System Info**: Footer with system details

### 5. Auto-Play System
**Component**: `SafeTransitCommand.tsx`

- **Play/Pause button** in top-right header
- Auto-advances through timeline at 100ms per minute
- Full 24-hour cycle takes ~2.4 minutes
- Loops back to 00:00 after 23:59

---

## Data Architecture

### File: `mockData.ts`

**Core Structure**:
```typescript
interface TimelineMinute {
  minute: number;              // 0-1439
  time_label: string;          // "HH:MM"
  game_state: GameState;       // Home/Away scores, clock, quarter
  threat_score: number;        // 0.0-1.0
  alert_message: string;       // AI reasoning message
  danger_routes: number[][][]; // Red dashed polylines
  safe_routes: number[][][];   // Green solid polylines
  blurbs: Array<{              // Marker warnings
    lat: number;
    lng: number;
    text: string;
  }>;
}
```

**Data Generation**:
- 1440-minute timeline for each scenario
- Game runs from minute 1080-1260 (18:00-21:00)
- Scores increment during game time
- Threat scores and routes change based on scenario logic
- Blurbs appear when capacity > 95%

**Scenario Logic**:
- **Normal**: Balanced game (21-17), low threat (0.3), safe routes active
- **High Attendance**: Close game (28-24), elevated threat (0.65), mixed routes
- **Blowout**: Score diverges in Q3 (14-42), critical threat (0.88), emergency rerouting

---

## State Management

### Main State (SafeTransitCommand.tsx)
```typescript
const [selectedScenario, setSelectedScenario] = useState(0);
const [currentMinute, setCurrentMinute] = useState(1125);
const [isPlaying, setIsPlaying] = useState(false);
```

**Data Flow**:
1. User selects scenario → `setSelectedScenario(index)`
2. Scenario change resets to key moment for that scenario
3. User scrubs timeline → `setCurrentMinute(minute)`
4. Current data = `scenarios[selectedScenario].timeline[currentMinute]`
5. Components render based on current data (no re-fetching)

**Performance**:
- All 1440 minutes pre-generated (no API calls)
- Map updates at 60fps (Canvas re-draws on data change)
- Smooth slider interaction (direct state updates)

---

## Technical Implementation

### Canvas Map Rendering
**Why Canvas over react-leaflet?**
- Avoids Leaflet CSS/image loading errors
- Full control over rendering and styling
- Better performance for real-time updates
- Easier to apply retro CRT effects

**Rendering Pipeline**:
1. Draw dark background (#0a0a0a)
2. Draw cyan grid (20px spacing)
3. Draw Lumen Field marker (cyan circle + ring)
4. Draw safe routes (green, solid, with shadow blur)
5. Draw danger routes (red, dashed)
6. Overlay scanlines + scanning beam
7. Render marker blurbs as positioned divs

### Animation System
**Motion (Framer Motion)**:
- Entry animations: Stagger delays (0.2s, 0.3s, 0.4s)
- Pulsing effects: opacity keyframes [0.3, 1, 0.3]
- Scanning beam: vertical translate animation (3s infinite)
- Glassmorphism panels: backdrop-blur + opacity

### Responsive Scaling
**Device Mockup System**:
```typescript
const scale = deviceWidth / 1000;
transform: `scale(${scale})`
```
- UI scales proportionally with device image
- Footer padding scales with device
- Border radius scales for consistent look

---

## Styling Approach

### Tailwind CSS v4
- Inline utility classes for rapid styling
- Custom styles via inline `<style>` tags (Canvas effects)
- No custom tailwind.config.js (using v4 defaults)
- Dark mode optimized (slate-950, slate-900 backgrounds)

### Key Tailwind Patterns
- **Borders**: `border-2 border-cyan-400`
- **Backgrounds**: `bg-slate-950 bg-opacity-80`
- **Blur**: `backdrop-blur-md` / `backdrop-blur-sm`
- **Text**: `text-cyan-400`, `text-emerald-400`, `text-red-500`
- **Font**: `font-mono` for all terminal text
- **Z-index**: `z-[999]`, `z-[1000]` for layering effects

---

## File Modifications Summary

### Created Files
1. `/components/SafeTransitCommand.tsx` - Main orchestration component
2. `/components/ScenarioSelector.tsx` - Scenario cards
3. `/components/TimelineSlider.tsx` - Timeline scrubber
4. `/components/TacticalMap.tsx` - Canvas tactical map
5. `/components/AlertPanel.tsx` - AI reasoning sidebar
6. `/components/mockData.ts` - 1440-minute simulation data

### Modified Files
1. `/App.tsx` - Replaced `RetroUIShuffler` with `SafeTransitCommand`
   - Changed background gradient (darker, more tactical)
   - Changed glow color (green → cyan)
   - Updated alt text and filter effects

### Preserved Files
- `/components/RetroUIShuffler.tsx` - Original retro UI (still exists)
- `/components/DynamicRetroUI.tsx` - Original dynamic UI (still exists)
- `/components/AlienFloraAnalysis.tsx` - Original flora analysis (still exists)
- Device mockup images (figma:asset imports)
- Footer with glass morphism and attribution

---

## Key Features Retained from Original

1. **Device Mockup System**: Retro gaming device frame with responsive scaling
2. **Screen Glow Effect**: Animated radial gradient overlay
3. **CRT Scanlines**: Repeating horizontal lines (2px spacing)
4. **Terminal Font**: Monospace throughout
5. **Glassmorphism Footer**: 10% bg opacity, 20px blur, Twitter attribution
6. **Pulsing Animations**: For active elements and indicators
7. **Corner Brackets**: Retro terminal decoration on panels

---

## Narrative Context

**Hackathon Story**: "3-Day Stress Test for 2026 World Cup"
- Day 1 (Scenario A): Normal group stage match, baseline testing
- Day 2 (Scenario B): High-stakes quarter-final, maximum capacity
- Day 3 (Scenario C): One-sided match causes unexpected early egress

**AI System Role**:
- Monitors real-time crowd density via cameras/sensors
- Predicts egress patterns based on game score differential
- Triggers emergency rerouting when capacity > 100%
- Displays reasoning in natural language ("Score diff exceeds 21pts...")

**User Interaction**:
- Select scenario to compare different crowd behaviors
- Scrub timeline to see AI decisions evolve over 24 hours
- Watch routes change from green (safe) to red (danger) in real-time
- Play/pause to auto-advance through critical moments

---

## Next Steps / Extension Ideas

1. **Enhanced Interactivity**:
   - Click on map routes to see detailed capacity stats
   - Hover over timeline to see preview of that moment
   - Click on alert log entries to jump to that timestamp

2. **Additional Scenarios**:
   - Inclement weather scenario
   - Multiple concurrent events
   - Transit system failure simulation

3. **Data Visualization**:
   - Heatmap overlay for crowd density
   - Line graph of threat score over time
   - Histogram of egress timing

4. **Backend Integration** (Future):
   - Replace mockData with API calls
   - Real-time camera feed integration
   - Live game score API integration
   - Historical data playback

5. **Advanced Features**:
   - Multi-camera view toggle
   - 3D crowd flow visualization
   - Predictive analytics dashboard
   - Emergency alert broadcast system

---

## Technical Constraints

### Current Limitations
- **No external APIs**: All data is pre-generated mock data
- **No real map tiles**: Canvas-based rendering instead of Leaflet
- **Fixed scenarios**: Only 3 pre-defined scenarios
- **Static routes**: Routes don't dynamically recalculate

### Browser Compatibility
- Requires modern browser with Canvas support
- Motion animations require JavaScript enabled
- Backdrop-filter may not work in older browsers

### Performance Considerations
- Canvas re-renders on every timeline update (60fps target)
- 1440 timeline objects stored in memory per scenario (3 scenarios = 4320 objects)
- Smooth playback requires good device performance

---

## Color Reference

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary Accent | Cyan | `#00ffff` | Headers, borders, system text |
| Success/Safe | Emerald | `#10b981` | Safe routes, normal status |
| Warning | Amber | `#f59e0b` | Elevated threat, caution |
| Danger | Red | `#ef4444` | Critical alerts, danger routes |
| Background Dark | Slate 950 | `#020617` | Primary background |
| Background Mid | Slate 900 | `#0f172a` | Panel backgrounds |
| Text Secondary | Slate 400 | `#94a3b8` | Labels, muted text |

---

## Dependencies

### Core
- React (hooks: useState, useEffect, useRef)
- Motion (Framer Motion) - `motion/react`
- TypeScript

### No Longer Used
- ~~react-leaflet~~ (replaced with Canvas)
- ~~leaflet~~ (removed due to CSS errors)

### Figma Assets
- Device mockup image: `figma:asset/264f0a...`
- Background image: `figma:asset/1d58274...`

---

## Attribution

Created in Figma Make by [@hckmstrrahul](https://x.com/hckmstrrahul) • Sep 2025

Built for Hacklytics Hackathon - Best AI for Human Safety Track
