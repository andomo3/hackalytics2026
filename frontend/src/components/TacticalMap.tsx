import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Hotspot, Intersection, TransitStatus } from './types';

/**
 * CrowdShield tactical map renderer.
 *
 * Architecture:
 * - Canvas paints the Seattle basemap and tactical lines for fast timeline scrubbing.
 * - Absolute HTML overlays render station state and interactive hotspot elements.
 * - A fixed stadium-district bounding box maps lat/lng into local pixel coordinates.
 */

// ============================================================
//  BOUNDING BOX – Seattle Stadium District
//  Covers roughly Lumen Field to Harborview
// ============================================================
const BOUNDS = {
  latMin: 47.5830,
  latMax: 47.6060,
  lngMin: -122.3420,
  lngMax: -122.3140,
};

const LUMEN_FIELD = { lat: 47.5952, lng: -122.3316 };

// Known transit hubs
const TRANSIT_HUBS: Array<{
  id: string;
  label: string;
  lat: number;
  lng: number;
  statusKey: string;
}> = [
  { id: 'stadium_station', label: 'STADIUM STN', lat: 47.5980, lng: -122.3300, statusKey: 'stadium_station' },
  { id: 'king_st', label: 'KING ST STN', lat: 47.5990, lng: -122.3280, statusKey: 'king_st' },
];

// ============================================================
//  COORDINATE MATH
// ============================================================

interface Dims { w: number; h: number }

/** Convert geographic coordinates into local canvas pixel space. */
function mapLatLngToPixels(lat: number, lng: number, dims: Dims): { x: number; y: number } {
  const x = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * dims.w;
  // Invert Y: higher latitude = higher on screen = lower y
  const y = (1 - (lat - BOUNDS.latMin) / (BOUNDS.latMax - BOUNDS.latMin)) * dims.h;
  return { x, y };
}

// ============================================================
//  HEAT / COLOR HELPERS
// ============================================================

function getHeatColor(heat: number): string {
  if (heat >= 85) return '#ef4444';
  if (heat >= 65) return '#f97316';
  if (heat >= 40) return '#eab308';
  if (heat >= 15) return '#22d3ee';
  return '#334155';
}

function getHeatGlow(heat: number): string {
  if (heat >= 85) return 'rgba(239,68,68,0.7)';
  if (heat >= 65) return 'rgba(249,115,22,0.6)';
  if (heat >= 40) return 'rgba(234,179,8,0.4)';
  return 'rgba(34,211,238,0.3)';
}

// ============================================================
//  PROPS
// ============================================================

interface TacticalMapProps {
  dangerRoutes: number[][][];
  safeRoutes: number[][][];
  emergencyCorridors?: number[][][];
  transitStatus?: TransitStatus;
  blurbs: Array<{ lat: number; lng: number; text: string }>;
  hotspots: Hotspot[];
  intersections: Intersection[];
  onHotspotClick: (hotspot: Hotspot) => void;
}

// ============================================================
//  INTERSECTION TOOLTIP COMPONENT
// ============================================================

function IntersectionTooltip({ intersection, dims }: { intersection: Intersection; dims: Dims }) {
  const pos = mapLatLngToPixels(intersection.lat, intersection.lng, dims);
  const color = getHeatColor(intersection.heat);
  const threatColors: Record<string, string> = {
    LOW: '#22d3ee', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
  };
  const tc = threatColors[intersection.threat_level] || '#22d3ee';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute z-50 pointer-events-none"
      style={{
        left: pos.x + 18,
        top: pos.y - 12,
        minWidth: 260,
        maxWidth: 340,
        fontFamily: 'ui-monospace, monospace',
        background: 'rgba(2,6,23,0.95)',
        border: '1px solid #22d3ee',
        padding: '12px 16px',
        boxShadow: '0 0 20px rgba(34,211,238,0.15)',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 4 }}>INTERSECTION</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', marginBottom: 10, lineHeight: 1.3 }}>{intersection.name}</div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748b' }}>HEAT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color }}>{intersection.heat}%</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b' }}>CROWD</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0' }}>{intersection.crowd_estimate.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#64748b' }}>FLOW</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#22d3ee' }}>{intersection.flow_direction}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: tc, boxShadow: `0 0 10px ${tc}` }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: tc }}>{intersection.threat_level}</span>
      </div>
      <div style={{ fontSize: 13, color: '#94a3b8', borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: 8 }}>
        <span style={{ color: '#22d3ee', fontWeight: 700 }}>AI:</span> {intersection.ai_recommendation}
      </div>
    </motion.div>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================

export function TacticalMap({
  dangerRoutes = [],
  safeRoutes = [],
  emergencyCorridors = [],
  transitStatus,
  blurbs = [],
  hotspots = [],
  intersections = [],
  onHotspotClick,
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState<Dims>({ w: 800, h: 600 });
  const [hoveredIntersection, setHoveredIntersection] = useState<Intersection | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const animFrameRef = useRef(0);
  const emsPulseRef = useRef(0);

  // ---- Resize Observer ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDims = (width: number, height: number) => {
      if (width > 0 && height > 0) {
        setDims({ w: Math.round(width), h: Math.round(height) });
      }
    };

    updateDims(el.clientWidth, el.clientHeight);

    let ro: ResizeObserver | null = null;
    const onWindowResize = () => updateDims(el.clientWidth, el.clientHeight);

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          updateDims(width, height);
        }
      });
      ro.observe(el);
    } else {
      window.addEventListener('resize', onWindowResize);
    }

    return () => {
      if (ro) {
        ro.disconnect();
      } else {
        window.removeEventListener('resize', onWindowResize);
      }
    };
  }, []);

  // ---- EMS pulse animation loop ----
  useEffect(() => {
    if (emergencyCorridors.length === 0) {
      emsPulseRef.current = 0;
      return;
    }
    let running = true;
    const tick = () => {
      if (!running) return;
      emsPulseRef.current = (emsPulseRef.current + 2) % 200;
      // Only trigger repaint when we actually have corridors
      if (canvasRef.current) {
        drawCanvas();
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergencyCorridors, dims, safeRoutes, dangerRoutes, intersections]);

  // ============================================================
  //  SEATTLE VECTOR BASEMAP DATA
  //  Stylized polygons and lines for Elliott Bay, I-5, major roads
  // ============================================================

  // Elliott Bay water polygon (approximate coastline within our bounding box)
  const ELLIOTT_BAY: Array<[number, number]> = [
    [47.6060, -122.3420], // top-left corner
    [47.6060, -122.3380],
    [47.6045, -122.3370],
    [47.6030, -122.3375],
    [47.6010, -122.3385],
    [47.5990, -122.3395],
    [47.5975, -122.3400],
    [47.5960, -122.3410],
    [47.5940, -122.3415],
    [47.5920, -122.3420],
    [47.5900, -122.3420],
    [47.5880, -122.3420],
    [47.5830, -122.3420], // bottom-left corner
    [47.6060, -122.3420], // close loop
  ];

  // I-5 Highway corridor (runs roughly N-S through center of district)
  const I5_CORRIDOR: Array<[number, number]> = [
    [47.6060, -122.3285],
    [47.6040, -122.3282],
    [47.6020, -122.3278],
    [47.6000, -122.3275],
    [47.5980, -122.3270],
    [47.5960, -122.3265],
    [47.5940, -122.3260],
    [47.5920, -122.3255],
    [47.5900, -122.3250],
    [47.5880, -122.3245],
    [47.5860, -122.3240],
    [47.5830, -122.3235],
  ];

  // Major roads grid (stylized street segments)
  const ROAD_GRID: Array<{ from: [number, number]; to: [number, number]; major?: boolean }> = [
    // E-W streets
    { from: [47.6045, -122.3400], to: [47.6045, -122.3140], major: true },  // S Jackson St
    { from: [47.5990, -122.3400], to: [47.5990, -122.3140] },               // S King St
    { from: [47.5960, -122.3400], to: [47.5960, -122.3140] },               // S Dearborn St
    { from: [47.5935, -122.3400], to: [47.5935, -122.3140], major: true },  // S Royal Brougham
    { from: [47.5910, -122.3400], to: [47.5910, -122.3140] },               // S Atlantic St
    { from: [47.5895, -122.3400], to: [47.5895, -122.3140] },               // S Holgate St
    { from: [47.5878, -122.3400], to: [47.5878, -122.3140] },               // S Lander St
    // N-S streets
    { from: [47.6060, -122.3380], to: [47.5830, -122.3380] },               // Alaskan Way S
    { from: [47.6060, -122.3345], to: [47.5830, -122.3345], major: true },  // 1st Ave S
    { from: [47.6060, -122.3320], to: [47.5830, -122.3320] },               // Occidental Ave S
    { from: [47.6060, -122.3300], to: [47.5830, -122.3300] },               // 2nd Ave S / 3rd Ave S
    { from: [47.6060, -122.3260], to: [47.5830, -122.3260] },               // 4th Ave S
    { from: [47.6060, -122.3220], to: [47.5830, -122.3220] },               // Airport Way S / Rainier
    { from: [47.6060, -122.3180], to: [47.5830, -122.3180] },               // 6th Ave S
  ];

  // Rail lines (Link Light Rail)
  const RAIL_LINE: Array<[number, number]> = [
    [47.6060, -122.3310],
    [47.6020, -122.3305],
    [47.5990, -122.3295],
    [47.5970, -122.3290],
    [47.5950, -122.3295],
    [47.5930, -122.3295],
    [47.5900, -122.3285],
    [47.5870, -122.3275],
    [47.5830, -122.3265],
  ];

  // ---- Canvas drawing ----
  // Renders Seattle vector basemap first, then tactical routes, then event markers.
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = dims;
    try {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // --- Background (dark land) ---
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, w, h);

      // Helper to convert lat/lng to pixels
      const toPixels = (pt: number[] | [number, number]) => mapLatLngToPixels(pt[0], pt[1], dims);

    // ===============================================
    //  BASEMAP LAYER 1: Elliott Bay water
    // ===============================================
    ctx.beginPath();
    const bayStart = toPixels(ELLIOTT_BAY[0]);
    ctx.moveTo(bayStart.x, bayStart.y);
    for (let i = 1; i < ELLIOTT_BAY.length; i++) {
      const p = toPixels(ELLIOTT_BAY[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = '#0c1929';
    ctx.fill();
    // Water edge glow
    ctx.strokeStyle = 'rgba(34,211,238,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ===============================================
    //  BASEMAP LAYER 2: Road Grid
    // ===============================================
    ROAD_GRID.forEach((road) => {
      const from = toPixels(road.from);
      const to = toPixels(road.to);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = road.major ? 'rgba(51,65,85,0.5)' : 'rgba(30,41,59,0.45)';
      ctx.lineWidth = road.major ? 2 : 1;
      ctx.stroke();
    });

    // ===============================================
    //  BASEMAP LAYER 3: I-5 Highway
    // ===============================================
    // Wide dark highway bed
    ctx.beginPath();
    const i5Start = toPixels(I5_CORRIDOR[0]);
    ctx.moveTo(i5Start.x, i5Start.y);
    for (let i = 1; i < I5_CORRIDOR.length; i++) {
      const p = toPixels(I5_CORRIDOR[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = 'rgba(51,65,85,0.6)';
    ctx.lineWidth = 10;
    ctx.stroke();
    // Highway center dashes
    ctx.beginPath();
    ctx.moveTo(i5Start.x, i5Start.y);
    for (let i = 1; i < I5_CORRIDOR.length; i++) {
      const p = toPixels(I5_CORRIDOR[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = 'rgba(100,116,139,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ===============================================
    //  BASEMAP LAYER 4: Light Rail
    // ===============================================
    ctx.beginPath();
    const railStart = toPixels(RAIL_LINE[0]);
    ctx.moveTo(railStart.x, railStart.y);
    for (let i = 1; i < RAIL_LINE.length; i++) {
      const p = toPixels(RAIL_LINE[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = 'rgba(34,211,238,0.15)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // ===============================================
    //  BASEMAP LAYER 5: Glowing Grid Overlay
    // ===============================================
    const gridSpacing = 20;
    ctx.strokeStyle = 'rgba(0,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // ===============================================
    //  BASEMAP LABELS (street names -- muted)
    // ===============================================
    ctx.font = '600 9px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.35)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const labelOffset = 3;
    // Horizontal street labels
    const streetLabels: Array<{ lat: number; lng: number; text: string }> = [
      { lat: 47.6045, lng: -122.3395, text: 'S JACKSON ST' },
      { lat: 47.5990, lng: -122.3395, text: 'S KING ST' },
      { lat: 47.5935, lng: -122.3395, text: 'S ROYAL BROUGHAM' },
      { lat: 47.5895, lng: -122.3395, text: 'S HOLGATE ST' },
      { lat: 47.5878, lng: -122.3395, text: 'S LANDER ST' },
    ];
    streetLabels.forEach((sl) => {
      const p = toPixels([sl.lat, sl.lng]);
      ctx.fillText(sl.text, p.x + labelOffset, p.y + labelOffset);
    });
    // Vertical street labels
    ctx.save();
    const vStreetLabels: Array<{ lat: number; lng: number; text: string }> = [
      { lat: 47.6055, lng: -122.3345, text: '1ST AVE S' },
      { lat: 47.6055, lng: -122.3300, text: '3RD AVE S' },
      { lat: 47.6055, lng: -122.3260, text: '4TH AVE S' },
      { lat: 47.6055, lng: -122.3220, text: 'AIRPORT WAY' },
    ];
    vStreetLabels.forEach((vl) => {
      const p = toPixels([vl.lat, vl.lng]);
      ctx.save();
      ctx.translate(p.x + labelOffset, p.y + 4);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(vl.text, 0, 0);
      ctx.restore();
    });
    ctx.restore();

    // I-5 label
    ctx.font = 'bold 11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(100,116,139,0.5)';
    const i5LabelPos = toPixels([47.6000, -122.3275]);
    ctx.save();
    ctx.translate(i5LabelPos.x + 8, i5LabelPos.y);
    ctx.rotate(-0.08);
    ctx.fillText('I-5', 0, 0);
    ctx.restore();

    // Elliott Bay label
    ctx.font = 'italic 11px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(34,211,238,0.2)';
    const bayLabelPos = toPixels([47.5950, -122.3408]);
    ctx.save();
    ctx.translate(bayLabelPos.x, bayLabelPos.y);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ELLIOTT BAY', 0, 0);
    ctx.restore();

    // ===============================================
    //  TACTICAL OVERLAYS
    // ===============================================

    // --- Safe Routes ---
    safeRoutes.forEach((route) => {
      if (route.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 5;
      ctx.shadowColor = 'rgba(16,185,129,0.7)';
      ctx.shadowBlur = 18;
      ctx.setLineDash([]);
      const start = toPixels(route[0]);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < route.length; i++) {
        const p = toPixels(route[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // --- Danger Routes ---
    dangerRoutes.forEach((route) => {
      if (route.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.shadowColor = 'rgba(239,68,68,0.7)';
      ctx.shadowBlur = 16;
      ctx.setLineDash([8, 6]);
      const start = toPixels(route[0]);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < route.length; i++) {
        const p = toPixels(route[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // --- EMS Corridors ---
    emergencyCorridors.forEach((route) => {
      if (route.length < 2) return;

      // Thick blue base stroke
      ctx.beginPath();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 12;
      ctx.shadowColor = 'rgba(37,99,235,0.8)';
      ctx.shadowBlur = 20;
      ctx.setLineDash([]);
      const start = toPixels(route[0]);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < route.length; i++) {
        const p = toPixels(route[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Aggressive pulsing white overlay
      const pulseOpacity = 0.4 + 0.6 * Math.abs(Math.sin((emsPulseRef.current / 200) * Math.PI * 2));
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,255,255,${pulseOpacity.toFixed(2)})`;
      ctx.lineWidth = 5;
      ctx.setLineDash([12, 8]);
      ctx.lineDashOffset = -emsPulseRef.current;
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < route.length; i++) {
        const p = toPixels(route[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    });

    // --- Intersection heat dots (painted on canvas for perf) ---
    intersections.forEach((int) => {
      if (!int || !Number.isFinite(int.lat) || !Number.isFinite(int.lng) || !Number.isFinite(int.heat)) {
        return;
      }
      const pos = toPixels([int.lat, int.lng]);
      const color = getHeatColor(int.heat);
      const glow = getHeatGlow(int.heat);
      const radius = 6 + (int.heat / 100) * 14;
      const opacity = Math.max(0.5, int.heat / 100);

      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = int.heat >= 85 ? 24 : int.heat >= 65 ? 16 : 8;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Critical pulse ring
      if (int.heat >= 85) {
        const pulseRadius = radius + 6 + Math.sin(Date.now() / 300) * 4;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239,68,68,${0.4 + Math.sin(Date.now() / 300) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Heat label
      if (int.heat >= 30) {
        ctx.font = '700 11px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${int.heat}`, pos.x, pos.y);
        ctx.shadowBlur = 0;
      }
    });

    // --- Lumen Field marker ---
    const lf = toPixels([LUMEN_FIELD.lat, LUMEN_FIELD.lng]);
    // Outer glow ring
    ctx.beginPath();
    ctx.arc(lf.x, lf.y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,255,255,0.4)';
    ctx.shadowBlur = 16;
    ctx.stroke();
    // Core dot
    ctx.beginPath();
    ctx.arc(lf.x, lf.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,255,0.9)';
    ctx.shadowColor = 'rgba(0,255,255,0.8)';
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Label
    ctx.font = 'bold 12px ui-monospace, monospace';
    ctx.fillStyle = 'rgba(0,255,255,0.85)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    ctx.fillText('LUMEN FIELD', lf.x + 16, lf.y);
    ctx.shadowBlur = 0;

    // --- Blurb dots ---
    blurbs.forEach((blurb) => {
      const pos = toPixels([blurb.lat, blurb.lng]);
      const isWarning = blurb.text.includes('HIGH') || blurb.text.includes('110%');
      const color = isWarning ? '#ef4444' : '#f59e0b';
      const shadowColor = isWarning ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.8)';

      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

      setMapError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Canvas render failed';
      setMapError(message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims, safeRoutes, dangerRoutes, emergencyCorridors, intersections, blurbs]);

  // ---- Trigger canvas redraw on data / size changes ----
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // ---- Stats ----
  const criticalCount = useMemo(
    () => intersections.filter((i) => i.threat_level === 'CRITICAL').length,
    [intersections]
  );
  const visibleCount = intersections.length;

  // ---- Intersection hover handler via canvas hit-testing ----
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let closest: Intersection | null = null;
      let closestDist = 20; // threshold in pixels

      intersections.forEach((int) => {
        if (!int || !Number.isFinite(int.lat) || !Number.isFinite(int.lng)) return;
        const pos = mapLatLngToPixels(int.lat, int.lng, dims);
        const dist = Math.hypot(pos.x - mx, pos.y - my);
        if (dist < closestDist) {
          closestDist = dist;
          closest = int;
        }
      });

      setHoveredIntersection(closest);
    },
    [intersections, dims]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setHoveredIntersection(null);
  }, []);

  // ---- Determine which hotspot markers are locked down ----
  const stadiumLockdown = transitStatus?.stadium_station === 'LOCKED_DOWN';

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: '#080c14' }}>

      {/* ===== HUD Title Overlay ===== */}
      <motion.div
        className="absolute top-3 left-3 z-30 font-mono pointer-events-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div
          style={{
            border: '1px solid rgba(34, 211, 238, 0.6)',
            background: 'rgba(2, 6, 23, 0.9)',
            backdropFilter: 'blur(8px)',
            padding: '8px 12px',
          }}
        >
          <div style={{ color: '#22d3ee', fontSize: 13, marginBottom: 2, letterSpacing: '0.12em' }}>TACTICAL OVERVIEW</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>LUMEN FIELD DISTRICT</div>
          <div style={{ fontSize: 13, marginTop: 4, display: 'flex', gap: 8 }}>
            {safeRoutes.length > 0 && <span style={{ color: '#34d399' }}>{'SAFE:'}{safeRoutes.length}</span>}
            {dangerRoutes.length > 0 && <span style={{ color: '#ef4444' }}>{'DANGER:'}{dangerRoutes.length}</span>}
            {emergencyCorridors.length > 0 && <span style={{ color: '#60a5fa' }}>{'EMS:'}{emergencyCorridors.length}</span>}
            <span style={{ color: '#22d3ee' }}>{'INT:'}{visibleCount}</span>
            {criticalCount > 0 && <span style={{ color: '#ef4444' }}>{'CRIT:'}{criticalCount}</span>}
          </div>
        </div>
      </motion.div>

      {/* ===== HTML5 Canvas ===== */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
        style={{ width: dims.w, height: dims.h, cursor: 'crosshair' }}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
      />

      {mapError && (
        <div className="absolute bottom-3 right-3 z-50 pointer-events-none">
          <div className="font-mono text-[11px] text-red-400 border border-red-500 bg-black/70 px-2 py-1">
            MAP RENDER ERROR: {mapError}
          </div>
        </div>
      )}

      {/* ===== Foreground HTML Overlay ===== */}
      <div className="absolute inset-0 z-20 pointer-events-none">

        {/* -- Transit Hub Markers -- */}
        {TRANSIT_HUBS.map((hub) => {
          const pos = mapLatLngToPixels(hub.lat, hub.lng, dims);
          const status = transitStatus?.[hub.statusKey];
          const isLocked = status === 'LOCKED_DOWN';

          return (
            <div
              key={hub.id}
              className="absolute pointer-events-auto"
              style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {isLocked ? (
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [1, 0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'rgba(127,29,29,0.95)',
                      border: '4px solid #ef4444',
                      boxShadow: '0 0 40px rgba(239,68,68,0.9), 0 0 80px rgba(239,68,68,0.5), 0 0 120px rgba(239,68,68,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 32,
                      fontWeight: 900,
                      color: '#fee2e2',
                      textShadow: '0 0 12px rgba(239,68,68,0.9)',
                    }}
                  >
                    [ X ]
                  </div>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 16,
                      fontWeight: 900,
                      color: '#ef4444',
                      letterSpacing: '0.15em',
                      textShadow: '0 0 12px rgba(239,68,68,0.9), 0 0 24px rgba(239,68,68,0.5)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    STATION CLOSED
                  </div>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#22d3ee',
                      border: '2px solid rgba(0,255,255,0.8)',
                      boxShadow: '0 0 14px rgba(0,255,255,0.6)',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'rgba(34,211,238,0.9)',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                      textShadow: '0 0 6px rgba(0,0,0,0.8)',
                    }}
                  >
                    {hub.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* -- Hotspot Markers -- */}
        {hotspots.map((hotspot) => {
          const pos = mapLatLngToPixels(hotspot.lat, hotspot.lng, dims);
          const isStadium =
            hotspot.id.toLowerCase().includes('stadium') ||
            hotspot.name.toLowerCase().includes('stadium');
          const lockedDown = stadiumLockdown && isStadium;
          const size = 32 + Math.pow(Math.max(0, (hotspot.density_pct - 50) / 70), 1.5) * 50;
          const isCritical = hotspot.status === 'CRITICAL' || lockedDown;
          const colors =
            hotspot.density_pct > 90
              ? { fill: '#ef4444', stroke: '#dc2626', shadow: 'rgba(239,68,68,0.8)' }
              : hotspot.density_pct > 70
                ? { fill: '#fbbf24', stroke: '#f59e0b', shadow: 'rgba(245,158,11,0.8)' }
                : { fill: '#22d3ee', stroke: '#06b6d4', shadow: 'rgba(0,255,255,0.6)' };

          return (
            <motion.div
              key={hotspot.id}
              className="absolute pointer-events-auto cursor-crosshair"
              style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                zIndex: 25,
              }}
              whileHover={{ scale: 1.15 }}
              onClick={() => onHotspotClick(hotspot)}
            >
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: lockedDown ? 'rgba(127,29,29,0.92)' : colors.fill,
                  border: `3px solid ${lockedDown ? '#ef4444' : colors.stroke}`,
                  boxShadow: `0 0 ${isCritical ? 28 : 14}px ${colors.shadow}, 0 0 ${isCritical ? 56 : 28}px ${colors.shadow}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: lockedDown ? (size > 40 ? 24 : 18) : (size > 40 ? 16 : 13),
                  fontWeight: 800,
                  color: lockedDown ? '#fee2e2' : '#000',
                  textShadow: lockedDown ? '0 0 8px rgba(239,68,68,0.8)' : '0 0 4px rgba(255,255,255,0.5)',
                }}
              >
                {lockedDown ? '[ X ]' : `${hotspot.density_pct}%`}
              </div>
              {isCritical && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    border: `2px solid ${colors.stroke}`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </motion.div>
          );
        })}

        {/* -- Blurb Tooltips (appear on hover proximity via canvas) -- */}
        {blurbs.map((blurb, i) => {
          const pos = mapLatLngToPixels(blurb.lat, blurb.lng, dims);
          const isWarning = blurb.text.includes('HIGH') || blurb.text.includes('110%');
          return (
            <div
              key={`blurb-${i}`}
              className="absolute pointer-events-auto"
              style={{
                left: pos.x + 18,
                top: pos.y - 10,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 14,
                background: 'rgba(2,6,23,0.95)',
                border: '1px solid #22d3ee',
                padding: '8px 12px',
                color: isWarning ? '#ef4444' : blurb.text.includes('OPEN') ? '#34d399' : '#fbbf24',
                whiteSpace: 'nowrap',
                zIndex: 26,
                boxShadow: '0 0 16px rgba(34,211,238,0.2)',
              }}
            >
              <div style={{ fontWeight: 700, color: '#22d3ee', marginBottom: 2, fontSize: 11, letterSpacing: '0.08em' }}>ALERT</div>
              {blurb.text}
            </div>
          );
        })}

        {/* -- Intersection hover tooltip -- */}
        <AnimatePresence>
          {hoveredIntersection && (
            <IntersectionTooltip key={hoveredIntersection.id} intersection={hoveredIntersection} dims={dims} />
          )}
        </AnimatePresence>
      </div>

      {/* ===== CRT Scanline Overlay (subtle to avoid washing out map) ===== */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 255, 0.008) 2px,
              rgba(0, 255, 255, 0.008) 4px
            )
          `,
        }}
      />

      {/* ===== Vignette Overlay (reduced for projector) ===== */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* ===== Scanning Sweep Line ===== */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-40 map-scan-line"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,255,255,0.04) 50%, transparent 100%)',
          height: 60,
        }}
      />

      {/* ===== Bottom-left Coordinates ===== */}
      <div
        className="absolute bottom-3 left-3 z-40 font-mono pointer-events-none"
        style={{ fontSize: 13, color: 'rgba(34,211,238,0.5)' }}
      >
        <div>47.5952 N / 122.3316 W</div>
        <div style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)', marginTop: 2 }}>SEATTLE STADIUM DISTRICT</div>
      </div>

      {/* ===== Scan line animation ===== */}
      <style>{`
        .map-scan-line {
          animation: scanSweep 4s linear infinite;
        }
        @keyframes scanSweep {
          0% { top: -80px; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}


