import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hotspot, Intersection, TransitStatus } from './mockData';

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
        left: pos.x + 14,
        top: pos.y - 10,
        minWidth: 220,
        maxWidth: 280,
        fontFamily: 'ui-monospace, monospace',
        background: 'rgba(2,6,23,0.95)',
        border: '1px solid #22d3ee',
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 4 }}>INTERSECTION</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.3 }}>{intersection.name}</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: '#64748b' }}>HEAT</div>
          <div style={{ fontSize: 18, fontWeight: 700, color }}>{intersection.heat}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#64748b' }}>CROWD</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{intersection.crowd_estimate.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#64748b' }}>FLOW</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#22d3ee' }}>{intersection.flow_direction}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: tc, boxShadow: `0 0 6px ${tc}` }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: tc }}>{intersection.threat_level}</span>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', borderTop: '1px solid rgba(51,65,85,0.5)', paddingTop: 6 }}>
        <span style={{ color: '#22d3ee', fontWeight: 600 }}>AI:</span> {intersection.ai_recommendation}
      </div>
    </motion.div>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================

export function TacticalMap({
  dangerRoutes,
  safeRoutes,
  emergencyCorridors = [],
  transitStatus,
  blurbs,
  hotspots,
  intersections,
  onHotspotClick,
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState<Dims>({ w: 800, h: 600 });
  const [hoveredIntersection, setHoveredIntersection] = useState<Intersection | null>(null);
  const animFrameRef = useRef(0);
  const emsPulseRef = useRef(0);

  // ---- Resize Observer ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDims({ w: Math.round(width), h: Math.round(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
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

  // ---- Canvas drawing ----
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = dims;
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // --- Background ---
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // --- Grid ---
    const gridSpacing = 20;
    ctx.strokeStyle = 'rgba(0,255,255,0.045)';
    ctx.lineWidth = 0.5;
    ctx.shadowColor = 'rgba(0,255,255,0.08)';
    ctx.shadowBlur = 2;
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
    ctx.shadowBlur = 0;

    // Helper to convert route coords to pixels
    const toPixels = (pt: number[]) => mapLatLngToPixels(pt[0], pt[1], dims);

    // --- Safe Routes ---
    safeRoutes.forEach((route) => {
      if (route.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(16,185,129,0.5)';
      ctx.shadowBlur = 8;
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
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(239,68,68,0.5)';
      ctx.shadowBlur = 6;
      ctx.setLineDash([5, 5]);
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
      ctx.lineWidth = 8;
      ctx.shadowColor = 'rgba(37,99,235,0.6)';
      ctx.shadowBlur = 10;
      ctx.setLineDash([]);
      const start = toPixels(route[0]);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < route.length; i++) {
        const p = toPixels(route[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pulsing white overlay
      const pulseOpacity = 0.35 + 0.65 * Math.abs(Math.sin((emsPulseRef.current / 200) * Math.PI * 2));
      ctx.beginPath();
      ctx.strokeStyle = `rgba(248,250,252,${pulseOpacity.toFixed(2)})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
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
      const pos = toPixels([int.lat, int.lng]);
      const color = getHeatColor(int.heat);
      const glow = getHeatGlow(int.heat);
      const radius = 4 + (int.heat / 100) * 10;
      const opacity = Math.max(0.4, int.heat / 100);

      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = int.heat >= 85 ? 16 : int.heat >= 65 ? 10 : 6;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Critical pulse ring
      if (int.heat >= 85) {
        const pulseRadius = radius + 4 + Math.sin(Date.now() / 300) * 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239,68,68,${0.3 + Math.sin(Date.now() / 300) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Heat label
      if (int.heat >= 30) {
        ctx.font = '700 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText(`${int.heat}`, pos.x, pos.y);
        ctx.shadowBlur = 0;
      }
    });

    // --- Lumen Field marker ---
    const lf = toPixels([LUMEN_FIELD.lat, LUMEN_FIELD.lng]);
    ctx.beginPath();
    ctx.arc(lf.x, lf.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,255,255,0.9)';
    ctx.shadowColor = 'rgba(0,255,255,0.6)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lf.x, lf.y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // --- Blurb dots ---
    blurbs.forEach((blurb) => {
      const pos = toPixels([blurb.lat, blurb.lng]);
      const isWarning = blurb.text.includes('HIGH') || blurb.text.includes('110%');
      const color = isWarning ? '#ef4444' : '#f59e0b';
      const shadowColor = isWarning ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.8)';

      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

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
          <div style={{ color: '#22d3ee', fontSize: 11, marginBottom: 2, letterSpacing: '0.1em' }}>TACTICAL</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>LUMEN FIELD</div>
          <div style={{ fontSize: 11, marginTop: 2, display: 'flex', gap: 6 }}>
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
                  animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'rgba(127,29,29,0.92)',
                      border: '3px solid #ef4444',
                      boxShadow: '0 0 24px rgba(239,68,68,0.9), 0 0 48px rgba(239,68,68,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 22,
                      fontWeight: 700,
                      color: '#fee2e2',
                    }}
                  >
                    [ X ]
                  </div>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#ef4444',
                      letterSpacing: '0.1em',
                      textShadow: '0 0 6px rgba(239,68,68,0.8)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    STATION CLOSED
                  </div>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: '#22d3ee',
                      border: '2px solid rgba(0,255,255,0.7)',
                      boxShadow: '0 0 8px rgba(0,255,255,0.5)',
                    }}
                  />
                  <div
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 9,
                      fontWeight: 600,
                      color: 'rgba(34,211,238,0.8)',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
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
          const size = 24 + Math.pow(Math.max(0, (hotspot.density_pct - 50) / 70), 1.5) * 40;
          const isCritical = hotspot.status === 'CRITICAL' || lockedDown;
          const colors =
            hotspot.density_pct > 90
              ? { fill: '#ef4444', stroke: '#dc2626', shadow: 'rgba(239,68,68,0.7)' }
              : hotspot.density_pct > 70
                ? { fill: '#fbbf24', stroke: '#f59e0b', shadow: 'rgba(245,158,11,0.7)' }
                : { fill: '#22d3ee', stroke: '#06b6d4', shadow: 'rgba(0,255,255,0.5)' };

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
                  border: `2px solid ${lockedDown ? '#ef4444' : colors.stroke}`,
                  boxShadow: `0 0 ${isCritical ? 16 : 8}px ${colors.shadow}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: lockedDown ? (size > 30 ? 20 : 16) : (size > 30 ? 13 : 11),
                  fontWeight: 700,
                  color: lockedDown ? '#fee2e2' : '#000',
                  textShadow: '0 0 4px rgba(255,255,255,0.5)',
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
                left: pos.x + 14,
                top: pos.y - 8,
                fontFamily: 'ui-monospace, monospace',
                fontSize: 11,
                background: 'rgba(2,6,23,0.95)',
                border: '1px solid #22d3ee',
                padding: '5px 8px',
                color: isWarning ? '#ef4444' : blurb.text.includes('OPEN') ? '#34d399' : '#fbbf24',
                whiteSpace: 'nowrap',
                zIndex: 26,
              }}
            >
              <div style={{ fontWeight: 700, color: '#22d3ee', marginBottom: 1, fontSize: 9 }}>ALERT</div>
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

      {/* ===== CRT Scanline Overlay ===== */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 255, 0.015) 2px,
              rgba(0, 255, 255, 0.015) 4px
            )
          `,
        }}
      />

      {/* ===== Vignette Overlay ===== */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* ===== Scanning Sweep Line ===== */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-40 map-scan-line"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,255,255,0.06) 50%, transparent 100%)',
          height: 80,
        }}
      />

      {/* ===== Bottom-left Coordinates ===== */}
      <div
        className="absolute bottom-3 left-3 z-40 font-mono pointer-events-none"
        style={{ fontSize: 11, color: 'rgba(34,211,238,0.45)' }}
      >
        <div>47.5952 N</div>
        <div>122.3316 W</div>
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
