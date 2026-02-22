# SafeTransit Tactical Command Center - Frontend State Documentation

## Project Overview
SafeTransit is a hackathon project focused on preventing crowd crushes during the 2026 World Cup at Seattle's Lumen Field. The frontend is a fully interactive tactical command center with a retro sci-fi terminal aesthetic (green/cyan text, CRT effects, scanlines, terminal fonts).

**Design Philosophy**: Hybrid fullscreen terminal with HUD elements - maximum screen real estate for projector presentations while maintaining tactical command center aesthetics.

---

## Current Visual Aesthetic

### Retro Sci-Fi Terminal Theme
- **Color Palette**: 
  - Primary: Cyan (`#00ffff`) for highlights and interactive elements
  - Secondary: Green (`#00ff88`, `#10b981`) for status indicators
  - Danger: Red (`#ef4444`) for alerts and danger zones
  - Background: Dark slate/black gradient (`#0a1a1a` → `#000000`)
  
- **CRT Effects**:
  - Scanlines overlay (repeating 3px gradient lines at 40% opacity)
  - Screen glow (pulsing radial gradient with 4s animation cycle)
  - Vignette (radial gradient from center to edges)
  - Chromatic aberration effect on text shadows
  
- **Typography**: 
  - Primary: `Departure Mono` (monospace terminal font)
  - All text has retro phosphor glow effect via text-shadow

### HUD Frame Elements
- **Corner Brackets**: Animated cyan SVG brackets in all 4 corners (20px x 20px), pulsing with staggered delays
- **Top Status Bar**: Shows system name, version, date/time (live), online status
- **Side Indicators**: Vertical pulsing bars on left/right edges (3 bars each side, animated height changes)
- **Footer**: Creator attribution with backdrop blur

---

## Application Structure

### Main Entry Point: `/App.tsx`
**Purpose**: Fullscreen container with HUD overlay

**Layout**:
```
<App>
  ├── Background (radial gradient)
  ├── CRT Scanlines (fixed overlay, z-40)
  ├── Screen Glow (pulsing effect, z-40)
  ├── Vignette (dark edges, z-40)
  ├── SafeTransitCommand (main content, z-10, padded: px-24 pt-20 pb-16)
  ├── HUDFrame (corner brackets + status bar, z-40)
  └── Footer (creator info, z-50)
</App>
```

**Key Details**:
- Padding ensures content doesn't overlap with HUD elements
- `px-24`: Left/right margins for corner brackets
- `pt-20`: Top margin to avoid status bar overlap
- `pb-16`: Bottom margin to avoid footer overlap

---

### Core Component: `/components/SafeTransitCommand.tsx`
**Purpose**: Main application logic and layout orchestrator

**State Management**:
```typescript
const [selectedScenario, setSelectedScenario] = useState(0); // 0=Normal, 1=High-Attendance, 2=Blowout
const [currentMinute, setCurrentMinute] = useState(1125); // 0-1439 (24-hour timeline)
const [isPlaying, setIsPlaying] = useState(false); // Auto-play toggle
const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null); // Modal state
```

**Layout Grid** (Flexbox columns):
```
┌─────────────────────────────────────────────────┐
│ ScenarioSelector (3 cards)                      │
├─────────────────────────────────────────────────┤
│ TacticalMap (60%)    │ AlertPanel (40%)         │
│                      │                          │
│ (Canvas + Hotspots)  │ (AI Reasoning)           │
├─────────────────────────────────────────────────┤
│ TimelineSlider (24-hour scrubber)               │
└─────────────────────────────────────────────────┘
```

**Auto-Play Logic**:
- When `isPlaying === true`, increments `currentMinute` every 100ms
- Full 24-hour cycle takes ~2.4 minutes
- Loops back to minute 0 after reaching 1439

**Scenario Reset Behavior**:
- Normal Game → jumps to minute 1140 (7:00 PM - game start)
- High-Attendance → jumps to minute 1200 (8:00 PM - mid-game)
- Blowout → jumps to minute 1125 (6:45 PM - critical moment)

---

## Component Breakdown

### 1. ScenarioSelector (`/components/ScenarioSelector.tsx`)
**Purpose**: Choose between 3 pre-configured crowd scenarios

**Props**:
```typescript
{
  selectedScenario: number;
  onScenarioChange: (index: number) => void;
}
```

**UI**:
- 3 cards in horizontal grid
- Active card: Cyan border glow + green "ACTIVE" badge
- Inactive cards: Gray border, 70% opacity
- Each card shows: Title, Description, Risk Level
- Hover effect: Scale up slightly with glow intensification

**Scenarios**:
1. **Normal Game Day** (Risk: LOW)
2. **High-Attendance Event** (Risk: MEDIUM) 
3. **Blowout Victory** (Risk: HIGH)

---

### 2. TacticalMap (`/components/TacticalMap.tsx`)
**Purpose**: Hybrid Canvas/HTML interactive map with heatmap hotspots

**Implementation Strategy**:
- **Canvas Layer** (background): Grid lines, route paths (CURRENTLY INCOMPLETE)
- **HTML Layer** (foreground): Absolutely positioned hotspot divs

**Props**:
```typescript
{
  currentData: TimelineData; // Contains hotspots array, routes, alerts
  onHotspotClick: (hotspot: Hotspot) => void;
}
```

**Canvas Reference**:
```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
```

**Canvas Drawing** (in `useEffect`):
- Clears canvas on each render
- Draws 600x400 grid with cyan lines (50px spacing)
- **MISSING**: Route visualization, Seattle map overlay, Lumen Field stadium

**Hotspot System**:
- Uses `HeatmapHotspots` component (see below)
- Positions: `{ x: number, y: number }` as percentages (0-100)
- Density levels: 0.0 - 1.0 (determines color/size)

---

### 3. HeatmapHotspots (`/components/HeatmapHotspots.tsx`)
**Purpose**: Interactive density visualization overlays

**Rendering**:
```typescript
hotspots.map(hotspot => (
  <motion.div
    style={{
      position: 'absolute',
      left: `${hotspot.x}%`,
      top: `${hotspot.y}%`,
      transform: 'translate(-50%, -50%)'
    }}
  />
))
```

**Visual States** (based on `density`):
| Density Range | Color | Size | Glow | Label |
|--------------|-------|------|------|-------|
| 0.0 - 0.3    | Green | 12px | Soft | SAFE |
| 0.3 - 0.6    | Yellow| 16px | Medium | MODERATE |
| 0.6 - 0.8    | Orange| 20px | Strong | ELEVATED |
| 0.8 - 1.0    | Red   | 24px | Intense | CRITICAL |

**Interaction**:
- Click: Opens `HotspotModal` with detailed info
- Hover: Pulse animation + cursor pointer
- Continuous pulse animation (scale 1.0 → 1.2 → 1.0)

**Accessibility**:
- Labeled with density percentage overlay
- Color + size redundancy for colorblind users

---

### 4. TimelineSlider (`/components/TimelineSlider.tsx`)
**Purpose**: 24-hour scrubber with play/pause controls

**Props**:
```typescript
{
  currentMinute: number; // 0-1439
  onMinuteChange: (minute: number) => void;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
}
```

**UI Components**:
- **Play/Pause Button**: Toggle icon (Play/Pause from lucide-react)
- **Slider Input**: `<input type="range" min="0" max="1439" />`
- **Time Display**: Converts minutes to HH:MM format (e.g., "18:45")
- **Tick Marks**: Visual indicators at 6-hour intervals

**Time Conversion**:
```typescript
const hours = Math.floor(currentMinute / 60);
const minutes = currentMinute % 60;
const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
```

**Styling**:
- Custom range input with cyan accent color
- Glowing thumb on hover/drag
- Progress track shows elapsed time in cyan

---

### 5. AlertPanel (`/components/AlertPanel.tsx`)
**Purpose**: Display AI reasoning for crowd safety rerouting decisions

**Props**:
```typescript
{
  currentData: TimelineData;
}
```

**Data Structure**:
```typescript
interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  aiReasoning: string;
  timestamp: string; // HH:MM format
}
```

**UI Layout**:
- Scrollable panel (max-height with overflow-y-auto)
- Each alert card includes:
  - Icon (AlertTriangle, AlertCircle, Info)
  - Type badge (color-coded)
  - Title + Timestamp
  - Message
  - Expandable "AI Reasoning" section

**AI Reasoning Section**:
- Collapsed by default
- Click "View AI Reasoning" to expand
- Shows detailed decision-making process
- Monospace font for technical readability

**Alert Types Styling**:
- `warning`: Yellow border, amber icon
- `danger`: Red border, red icon  
- `info`: Blue border, blue icon

---

### 6. HotspotModal (`/components/HotspotModal.tsx`)
**Purpose**: Detailed view when clicking a map hotspot

**Props**:
```typescript
{
  hotspot: Hotspot | null;
  onClose: () => void;
}
```

**Content**:
- Location name/ID
- Current crowd density (bar chart visualization)
- Predicted density (30min forecast)
- Safety status
- Recommended actions
- Historical trends graph

**Behavior**:
- AnimatePresence for smooth enter/exit
- Backdrop click closes modal
- ESC key support (future enhancement)

---

## Data Structure & Simulation

### Mock Data Source: `/components/mockData.ts`

**Scenarios Array**:
```typescript
export const scenarios: Scenario[] = [
  {
    id: 'normal',
    name: 'Normal Game Day',
    description: 'Standard match attendance',
    riskLevel: 'low',
    timeline: { /* 1440 minutes of data */ }
  },
  // ... High-Attendance, Blowout
];
```

**Timeline Structure** (per scenario):
```typescript
timeline: {
  0: TimelineData,    // 00:00 AM
  1: TimelineData,    // 00:01 AM
  ...
  1439: TimelineData  // 11:59 PM
}
```

**TimelineData Interface**:
```typescript
interface TimelineData {
  hotspots: Hotspot[];  // 5-8 locations with density data
  routes: Route[];      // Safe (green) vs Danger (red) paths
  alerts: Alert[];      // 0-3 active alerts
}
```

**Hotspot Interface**:
```typescript
interface Hotspot {
  id: string;           // e.g., "gate-a", "concourse-west"
  name: string;         // e.g., "North Gate A"
  x: number;            // 0-100 (percentage position)
  y: number;            // 0-100 (percentage position)
  density: number;      // 0.0-1.0 (crowd density)
  capacity: number;     // Max safe capacity
  current: number;      // Current crowd count
  trend: 'increasing' | 'stable' | 'decreasing';
}
```

**Route Interface**:
```typescript
interface Route {
  id: string;
  type: 'safe' | 'danger';
  path: { x: number; y: number }[]; // Array of coordinates
  strokeStyle: 'solid' | 'dashed';
  label: string;
}
```

### Simulation Logic

**Density Calculation** (simplified algorithm):
```typescript
// Base density varies by scenario
// Normal: 0.2-0.6 range
// High-Attendance: 0.4-0.8 range  
// Blowout: 0.6-1.0 range

// Time-based modulation:
const preGamePeak = Math.sin((minute - 1080) / 120) * 0.3; // Peak at 6:00 PM
const postGameSurge = minute > 1320 ? 0.4 : 0.0; // After 10:00 PM
const finalDensity = baseDensity + preGamePeak + postGameSurge;
```

**Alert Generation**:
- Triggers when density > 0.7 (warning) or > 0.85 (danger)
- AI reasoning generated based on:
  - Current density vs capacity
  - Rate of change (trend)
  - Adjacent hotspot spillover
  - Historical patterns

**Route Updates**:
- Routes change from "safe" → "danger" when:
  - Adjacent hotspots exceed 0.75 density
  - Predicted congestion in next 15 minutes
- Visual update: Green solid → Red dashed

---

## Current Limitations & Missing Features

### ✅ COMPLETED
- [x] Fullscreen HUD layout with corner brackets
- [x] Scenario selector with 3 cards
- [x] 24-hour timeline scrubber with play/pause
- [x] Interactive heatmap hotspots (click to view details)
- [x] Alert panel with AI reasoning
- [x] Auto-play simulation
- [x] Responsive density visualization (color + size coding)
- [x] Retro CRT aesthetic (scanlines, glow, terminal font)

### ❌ MISSING / INCOMPLETE

#### 1. **Tactical Map Background**
**Current State**: Canvas only shows grid lines
**Missing**:
- Seattle map overlay image/SVG
- Lumen Field stadium outline
- Street names and landmarks
- Route path visualization (safe=green solid, danger=red dashed)

**Implementation Needed**:
```typescript
// In TacticalMap.tsx useEffect:
const ctx = canvas.getContext('2d');

// Draw Seattle map image
const mapImg = new Image();
mapImg.src = '/seattle-map.png'; // Need to add this asset
ctx.drawImage(mapImg, 0, 0, 600, 400);

// Draw routes
currentData.routes.forEach(route => {
  ctx.beginPath();
  ctx.strokeStyle = route.type === 'safe' ? '#10b981' : '#ef4444';
  ctx.lineWidth = 3;
  ctx.setLineDash(route.strokeStyle === 'dashed' ? [10, 5] : []);
  
  route.path.forEach((point, i) => {
    const x = (point.x / 100) * 600;
    const y = (point.y / 100) * 400;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
});
```

#### 2. **Route Data Population**
**Current State**: `routes` array in mockData.ts is empty
**Needed**:
- Define realistic route paths from Lumen Field exits
- Create safe routes for normal conditions
- Create danger routes that activate during high density
- Update routes dynamically based on timeline position

**Example Route Data**:
```typescript
routes: [
  {
    id: 'north-exit-safe',
    type: 'safe',
    path: [
      { x: 50, y: 40 },  // Stadium north exit
      { x: 45, y: 20 },  // Occidental Ave
      { x: 40, y: 10 }   // Safe dispersal point
    ],
    strokeStyle: 'solid',
    label: 'North Exit → Occidental'
  },
  // ... more routes
]
```

#### 3. **Enhanced Hotspot Details**
**Current State**: Basic info in modal
**Missing**:
- Historical trend charts (last 60 minutes)
- Predicted density graph (next 30 minutes)
- Recommended alternative routes
- Real-time capacity utilization bar chart

#### 4. **Performance Optimization**
**Potential Issues**:
- Canvas redraws on every timeline tick (60fps target)
- Large number of hotspot divs (re-rendering)

**Suggested Optimizations**:
```typescript
// Use memo for expensive calculations
const hotspotElements = useMemo(() => 
  hotspots.map(h => <HotspotDiv key={h.id} hotspot={h} />),
  [hotspots]
);

// Debounce canvas redraws
const debouncedDraw = useMemo(
  () => debounce(drawCanvas, 16), // ~60fps
  []
);
```

#### 5. **Real-Time Data Integration** (Future)
Currently uses mock data. For production:
- WebSocket connection to backend
- Live crowd density from cameras/sensors
- Dynamic AI reasoning updates
- Alert push notifications

---

## File Structure

```
/
├── App.tsx                           # Main entry, HUD container
├── styles/
│   └── globals.css                   # Tailwind v4, CRT effects
├── components/
│   ├── SafeTransitCommand.tsx        # Core app logic & layout
│   ├── ScenarioSelector.tsx          # 3-card scenario picker
│   ├── TacticalMap.tsx               # Canvas + HTML hybrid map
│   ├── HeatmapHotspots.tsx           # Interactive density markers
│   ├── TimelineSlider.tsx            # 24hr scrubber + play/pause
│   ├── AlertPanel.tsx                # AI reasoning display
│   ├── HotspotModal.tsx              # Detailed hotspot view
│   ├── HUDFrame.tsx                  # Corner brackets + status bar
│   └── mockData.ts                   # Simulation data (3 scenarios x 1440 minutes)
└── FRONTEND_STATE.md                 # This document
```

---

## How the Simulation Works (Step-by-Step)

### 1. **Initialization**
```typescript
// User loads app
selectedScenario = 0 (Normal Game)
currentMinute = 1125 (6:45 PM - critical moment)
isPlaying = false
```

### 2. **Data Lookup**
```typescript
const currentScenario = scenarios[selectedScenario];
const currentData = currentScenario.timeline[currentMinute];
// Returns: { hotspots: [...], routes: [...], alerts: [...] }
```

### 3. **Rendering Pipeline**
```typescript
// SafeTransitCommand passes data down:
<TacticalMap currentData={currentData} />
  ↓ Draws canvas grid + routes
  ↓ Renders <HeatmapHotspots hotspots={currentData.hotspots} />
    ↓ Creates positioned divs for each hotspot
    ↓ Applies color/size based on density
    
<AlertPanel currentData={currentData} />
  ↓ Maps over currentData.alerts
  ↓ Displays AI reasoning for each alert
  
<TimelineSlider currentMinute={currentMinute} />
  ↓ Shows slider at minute 1125
  ↓ Displays "18:45"
```

### 4. **User Interaction: Scrubbing Timeline**
```typescript
// User drags slider to minute 1200 (8:00 PM)
onMinuteChange(1200)
  ↓ setCurrentMinute(1200)
  ↓ Triggers re-render
  ↓ Looks up scenarios[0].timeline[1200]
  ↓ Updates hotspot positions, colors, alerts
  ↓ Canvas redraws routes (if implemented)
  ↓ 60fps smooth animation via Motion
```

### 5. **User Interaction: Changing Scenarios**
```typescript
// User clicks "High-Attendance Event" card
onScenarioChange(1)
  ↓ setSelectedScenario(1)
  ↓ setCurrentMinute(1200) // Auto-jumps to 8:00 PM
  ↓ Loads scenarios[1].timeline[1200]
  ↓ Higher density hotspots appear
  ↓ More danger routes activate
  ↓ More critical alerts shown
```

### 6. **Auto-Play Mode**
```typescript
// User clicks play button
setIsPlaying(true)
  ↓ useEffect interval starts (100ms ticks)
  ↓ Every 100ms: currentMinute += 1
  ↓ Timeline slider moves smoothly
  ↓ Hotspots update colors/sizes in real-time
  ↓ Alerts appear/disappear dynamically
  ↓ Full 24-hour cycle = 2.4 minutes
  ↓ Loops back to minute 0 automatically
```

### 7. **Hotspot Click Interaction**
```typescript
// User clicks red hotspot on map
onHotspotClick(hotspot)
  ↓ setSelectedHotspot(hotspot)
  ↓ <HotspotModal> AnimatePresence triggers
  ↓ Modal slides in from center
  ↓ Shows: density, capacity, trends, recommendations
  ↓ User clicks backdrop → onClose() → modal slides out
```

---

## Technical Implementation Notes

### Canvas Performance
- Canvas size: 600x400px (scaled to fit container)
- Grid: 12x8 cells (50px spacing)
- Redraw trigger: `useEffect([currentData])` dependency
- **Optimization needed**: Only redraw changed regions

### Motion Animations
- Hotspot pulse: 2s infinite loop, scale 1.0 → 1.2
- Corner brackets: Staggered opacity 0.6 → 1.0 (2s each)
- Status bar: Slide down on mount (1s duration)
- Screen glow: 4s infinite opacity pulse

### Responsive Design
- Fixed aspect ratio for tactical map
- Flexbox layout adapts to screen size
- Padding ensures HUD elements don't overlap content
- Text scales with container (uses relative units)

### Accessibility Considerations
- Color + size redundancy for density levels
- High contrast text (cyan on black)
- Keyboard navigation (partial - needs enhancement)
- Screen reader labels (missing - future work)

---

## Next Steps for Agent

### Priority 1: Complete Tactical Map
1. **Add Seattle/Lumen Field Background**
   - Find or create simplified map image of stadium area
   - Import as asset (Unsplash or custom SVG)
   - Draw to canvas in TacticalMap.tsx useEffect
   
2. **Implement Route Visualization**
   - Add route path data to mockData.ts timeline objects
   - Draw routes on canvas with proper styling:
     - Safe routes: Green (#10b981), solid, 3px width
     - Danger routes: Red (#ef4444), dashed [10,5], 3px width
   - Update routes based on nearby hotspot density

### Priority 2: Enhance Simulation Data
1. **Expand Route Definitions**
   - Define 5-7 major exit routes from Lumen Field
   - Create logic to toggle route.type based on adjacent hotspot density
   - Add route labels that appear on hover

2. **Improve Alert Generation**
   - More varied AI reasoning messages
   - Progressive alert escalation (info → warning → danger)
   - Cross-reference multiple hotspots for spillover analysis

### Priority 3: Polish & Optimization
1. **Performance**
   - Memoize hotspot rendering
   - Implement canvas dirty region tracking
   - Debounce timeline updates during auto-play

2. **UX Enhancements**
   - Add keyboard shortcuts (Space = play/pause, Arrow keys = scrub)
   - Hotspot tooltip on hover (before click)
   - Route highlight on hotspot selection
   - Mini-map overview in corner

### Priority 4: Presentation Mode
1. **Projector Optimization**
   - Increase font sizes for readability
   - Higher contrast mode toggle
   - Fullscreen API integration (F11 alternative)
   - Hide footer in presentation mode

2. **Demo Features**
   - Preset "dramatic moments" quick-jump buttons
   - Auto-play with pause on critical alerts
   - Comparison view (side-by-side scenarios)

---

## Testing Checklist

- [ ] All 3 scenarios load correct data
- [ ] Timeline scrubber smoothly updates visuals
- [ ] Play/pause button toggles correctly
- [ ] Hotspot clicks open modal with correct data
- [ ] Modal closes on backdrop click
- [ ] Auto-play loops through full 24 hours
- [ ] Scenario switching resets timeline appropriately
- [ ] Alerts match density thresholds
- [ ] HUD elements don't overlap interactive content
- [ ] Responsive on different screen sizes
- [ ] CRT effects render without performance issues
- [ ] Text readable on projector (test at 1080p and 4K)

---

## Known Issues
1. **Map background missing** - Canvas only shows grid, no Seattle map
2. **Routes not rendering** - Canvas route drawing code incomplete
3. **Modal ESC key** - Doesn't close on ESC press (minor)
4. **Auto-play performance** - May stutter on low-end devices during rapid updates
5. **Accessibility** - No screen reader support, limited keyboard navigation

---

## Conclusion

The SafeTransit frontend is **~80% complete** with core functionality working:
- ✅ Interactive timeline simulation
- ✅ Scenario switching
- ✅ Hotspot density visualization
- ✅ Alert system with AI reasoning
- ✅ Retro terminal aesthetic

**Critical missing piece**: Tactical map visualization (Seattle overlay + route drawing)

**Agent Action**: Focus on Priority 1 tasks to complete the map visualization, then enhance simulation data for more realistic demo scenarios.
