import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hotspot, Intersection } from './mockData';

// Lumen Field center coordinates
const LUMEN_FIELD: [number, number] = [47.5952, -122.3316];
const DEFAULT_ZOOM = 15;
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { LatLngBounds, Map as LeafletMap } from 'leaflet';
import { Hotspot } from './mockData';
import { LUMEN_FIELD_TRAFFIC } from '../data/staticTraffic';
import '../styles/leaflet-retro.css';

interface TacticalMapProps {
  dangerRoutes: number[][][];
  safeRoutes: number[][][];
  blurbs: Array<{ lat: number; lng: number; text: string }>;
  hotspots: Hotspot[];
  intersections: Intersection[];
  onHotspotClick: (hotspot: Hotspot) => void;
}

/** Tracks current zoom level for child components */
function ZoomTracker({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom()),
    load: (e) => onZoomChange(e.target.getZoom()),
  });
  return null;
}

/** Keeps the map view in sync when scenario/time changes routes */
function MapUpdater({ routes }: { routes: number[][][] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map, routes]);
  return null;
}

/** Stadium marker rendered as a Leaflet DOM overlay */
function StadiumMarker() {
  const map = useMap();
  useEffect(() => {
    const marker = L.marker(LUMEN_FIELD, {
      icon: L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:28px;height:28px;">
            <div class="stadium-marker" style="
              position:absolute;top:50%;left:50%;
              transform:translate(-50%,-50%);
              width:14px;height:14px;border-radius:50%;
              background:rgba(0,255,255,0.9);border:2px solid #00ffff;
            "></div>
            <div class="stadium-ring" style="
              position:absolute;top:50%;left:50%;
              width:28px;height:28px;border-radius:50%;
              border:2px solid rgba(0,255,255,0.5);pointer-events:none;
            "></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
      interactive: false,
    });
    marker.addTo(map);
    return () => { marker.remove(); };
  }, [map]);
  return null;
}

// -------- Intersection heat helpers --------

function getHeatColor(heat: number): string {
  if (heat >= 85) return '#ef4444'; // red -- critical
  if (heat >= 65) return '#f97316'; // orange -- high
  if (heat >= 40) return '#eab308'; // yellow -- moderate
  if (heat >= 15) return '#22d3ee'; // cyan -- low activity
  return '#334155'; // slate -- minimal
}

function getHeatGlow(heat: number): string {
  if (heat >= 85) return 'rgba(239,68,68,0.7)';
  if (heat >= 65) return 'rgba(249,115,22,0.6)';
  if (heat >= 40) return 'rgba(234,179,8,0.4)';
  return 'rgba(34,211,238,0.3)';
}

function getHeatRadius(heat: number, zoom: number): number {
  const baseSize = 6 + (heat / 100) * 18; // 6px to 24px
  const zoomScale = Math.max(0.5, (zoom - 12) / 4); // scale down when zoomed out
  return Math.round(baseSize * zoomScale);
}

/** Determines the minimum heat to be visible at a given zoom level */
function getMinHeatForZoom(zoom: number): number {
  if (zoom >= 16) return 0;   // show everything when zoomed way in
  if (zoom >= 15) return 5;   // show almost all at default zoom
  if (zoom >= 14) return 30;  // only moderate+ at zoom 14
  if (zoom >= 13) return 55;  // only high+ at zoom 13
  return 75;                  // only critical at zoom 12 and below
}

// -------- Clustering logic --------

interface Cluster {
  lat: number;
  lng: number;
  intersections: Intersection[];
  avgHeat: number;
  maxHeat: number;
  totalCrowd: number;
}

/** Simple grid-based clustering: group nearby intersections based on zoom level */
function clusterIntersections(intersections: Intersection[], zoom: number): Cluster[] {
  // At high zoom, no clustering
  if (zoom >= 15) {
    return intersections.map((i) => ({
      lat: i.lat,
      lng: i.lng,
      intersections: [i],
      avgHeat: i.heat,
      maxHeat: i.heat,
      totalCrowd: i.crowd_estimate,
    }));
  }

  // Grid cell size increases as zoom decreases
  const cellSize = zoom >= 14 ? 0.003 : zoom >= 13 ? 0.006 : 0.01;

  const grid: Record<string, Intersection[]> = {};
  intersections.forEach((int) => {
    const cellX = Math.floor(int.lat / cellSize);
    const cellY = Math.floor(int.lng / cellSize);
    const key = `${cellX}_${cellY}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(int);
  });

  return Object.values(grid).map((group) => {
    const avgLat = group.reduce((s, i) => s + i.lat, 0) / group.length;
    const avgLng = group.reduce((s, i) => s + i.lng, 0) / group.length;
    const avgHeat = Math.round(group.reduce((s, i) => s + i.heat, 0) / group.length);
    const maxHeat = Math.max(...group.map((i) => i.heat));
    const totalCrowd = group.reduce((s, i) => s + i.crowd_estimate, 0);
    return { lat: avgLat, lng: avgLng, intersections: group, avgHeat, maxHeat, totalCrowd };
  });
}

/** Build the HTML for a retro-styled popup */
function buildIntersectionPopup(int: Intersection): string {
  const color = getHeatColor(int.heat);
  const threatColors: Record<string, string> = {
    LOW: '#22d3ee',
    MODERATE: '#eab308',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
  };
  const tc = threatColors[int.threat_level] || '#22d3ee';

  return `
    <div class="intersection-popup">
      <div style="font-size:11px;color:#94a3b8;letter-spacing:0.08em;margin-bottom:4px;">INTERSECTION</div>
      <div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:8px;line-height:1.3;">${int.name}</div>
      <div style="display:flex;gap:12px;margin-bottom:8px;">
        <div>
          <div style="font-size:10px;color:#64748b;">HEAT</div>
          <div style="font-size:18px;font-weight:700;color:${color};">${int.heat}%</div>
        </div>
        <div>
          <div style="font-size:10px;color:#64748b;">CROWD</div>
          <div style="font-size:18px;font-weight:700;color:#e2e8f0;">${int.crowd_estimate.toLocaleString()}</div>
        </div>
        <div>
          <div style="font-size:10px;color:#64748b;">FLOW</div>
          <div style="font-size:18px;font-weight:700;color:#22d3ee;">${int.flow_direction}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${tc};box-shadow:0 0 6px ${tc};"></div>
        <span style="font-size:11px;font-weight:600;color:${tc};">${int.threat_level}</span>
      </div>
      <div style="font-size:11px;color:#94a3b8;border-top:1px solid rgba(51,65,85,0.5);padding-top:6px;">
        <span style="color:#22d3ee;font-weight:600;">AI:</span> ${int.ai_recommendation}
      </div>
    </div>
  `;
}

/** Build the HTML for a cluster popup */
function buildClusterPopup(cluster: Cluster): string {
  const color = getHeatColor(cluster.maxHeat);
  const top3 = [...cluster.intersections]
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 3);

  return `
    <div class="intersection-popup">
      <div style="font-size:11px;color:#94a3b8;letter-spacing:0.08em;margin-bottom:4px;">CLUSTER (${cluster.intersections.length} intersections)</div>
      <div style="display:flex;gap:12px;margin-bottom:8px;">
        <div>
          <div style="font-size:10px;color:#64748b;">AVG HEAT</div>
          <div style="font-size:18px;font-weight:700;color:${color};">${cluster.avgHeat}%</div>
        </div>
        <div>
          <div style="font-size:10px;color:#64748b;">PEAK</div>
          <div style="font-size:18px;font-weight:700;color:${getHeatColor(cluster.maxHeat)};">${cluster.maxHeat}%</div>
        </div>
        <div>
          <div style="font-size:10px;color:#64748b;">CROWD</div>
          <div style="font-size:18px;font-weight:700;color:#e2e8f0;">${cluster.totalCrowd.toLocaleString()}</div>
        </div>
      </div>
      <div style="font-size:10px;color:#64748b;margin-bottom:4px;">BUSIEST:</div>
      ${top3.map((i) => `
        <div style="font-size:11px;color:#cbd5e1;display:flex;justify-content:space-between;padding:2px 0;">
          <span>${i.name.length > 28 ? i.name.slice(0, 28) + '...' : i.name}</span>
          <span style="color:${getHeatColor(i.heat)};font-weight:600;">${i.heat}%</span>
        </div>
      `).join('')}
    </div>
  `;
}

/** Renders intersection heat markers with zoom-based filtering and clustering */
function IntersectionHeatLayer({
  intersections,
  zoom,
}: {
  intersections: Intersection[];
  zoom: number;
}) {
  const map = useMap();
  const markersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    // Clean up previous markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const minHeat = getMinHeatForZoom(zoom);
    const visible = intersections.filter((i) => i.heat >= minHeat);

    const clusters = clusterIntersections(visible, zoom);

    clusters.forEach((cluster) => {
      const isSingle = cluster.intersections.length === 1;
      const displayHeat = isSingle ? cluster.avgHeat : cluster.maxHeat;
      const radius = getHeatRadius(displayHeat, zoom);
      const color = getHeatColor(displayHeat);
      const glow = getHeatGlow(displayHeat);
      const isCritical = displayHeat >= 85;
      const isHigh = displayHeat >= 65;

      // For clusters, show count; for singles, show heat%
      const label = isSingle
        ? `${cluster.avgHeat}`
        : `${cluster.intersections.length}`;

      const markerSize = isSingle ? radius * 2 : Math.max(radius * 2, 36);
      const innerSize = isSingle ? radius * 2 : Math.max(radius * 2, 36);

      const marker = L.marker([cluster.lat, cluster.lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:${markerSize}px;height:${markerSize}px;cursor:crosshair;">
              <div class="${isCritical ? 'heat-marker-critical' : isHigh ? 'heat-marker-high' : 'heat-marker'}" style="
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:${innerSize}px;height:${innerSize}px;
                border-radius:50%;
                background:${isSingle ? color : `radial-gradient(circle, ${color} 0%, ${color}88 60%, ${color}33 100%)`};
                border:${isSingle ? '2px' : '3px'} solid ${color};
                box-shadow:0 0 ${isCritical ? '16' : '8'}px ${glow}, inset 0 0 ${isCritical ? '8' : '4'}px ${glow};
                --pulse-color:${glow};
                display:flex;align-items:center;justify-content:center;
                opacity:${Math.max(0.5, displayHeat / 100)};
              ">
                <span style="
                  font-family:ui-monospace,monospace;
                  font-size:${markerSize > 30 ? '11px' : '9px'};
                  font-weight:700;
                  color:#fff;
                  text-shadow:0 0 4px rgba(0,0,0,0.8);
                  pointer-events:none;
                ">${label}</span>
              </div>
              ${!isSingle ? `
                <div style="
                  position:absolute;top:50%;left:50%;
                  transform:translate(-50%,-50%);
                  width:${markerSize + 8}px;height:${markerSize + 8}px;
                  border-radius:50%;
                  border:1px dashed ${color}88;
                  pointer-events:none;
                "></div>
              ` : ''}
            </div>
          `,
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        }),
        interactive: true,
      });

      // Popup
      const popupContent = isSingle
        ? buildIntersectionPopup(cluster.intersections[0])
        : buildClusterPopup(cluster);

      marker.bindPopup(popupContent, {
        className: 'retro-popup',
        maxWidth: 280,
        closeButton: true,
        autoPan: true,
        offset: [0, -8],
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [map, intersections, zoom]);

  return null;
}

/** Hotspot markers rendered as Leaflet DOM overlays for click handling */
function HotspotMarkers({
  hotspots,
  onHotspotClick,
}: {
  hotspots: Hotspot[];
  onHotspotClick: (h: Hotspot) => void;
}) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    hotspots.forEach((hotspot) => {
      const size = 24 + Math.pow(Math.max(0, (hotspot.density_pct - 50) / 70), 1.5) * 40;
      const isCritical = hotspot.status === 'CRITICAL';
      const colors = hotspot.density_pct > 90
        ? { fill: '#ef4444', stroke: '#dc2626', shadow: 'rgba(239,68,68,0.7)' }
        : hotspot.density_pct > 70
          ? { fill: '#fbbf24', stroke: '#f59e0b', shadow: 'rgba(245,158,11,0.7)' }
          : { fill: '#22d3ee', stroke: '#06b6d4', shadow: 'rgba(0,255,255,0.5)' };

      const marker = L.marker([hotspot.lat, hotspot.lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:${size}px;height:${size}px;cursor:crosshair;">
              <div class="hotspot-marker" style="
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:${size}px;height:${size}px;border-radius:50%;
                background:${colors.fill};border:2px solid ${colors.stroke};
                --pulse-color:${colors.shadow};
                display:flex;align-items:center;justify-content:center;
              ">
                <span style="
                  font-family:ui-monospace,monospace;font-size:${size > 30 ? '13px' : '11px'};
                  font-weight:700;color:#000;
                  text-shadow:0 0 4px rgba(255,255,255,0.5);pointer-events:none;
                ">${hotspot.density_pct}%</span>
              </div>
              ${isCritical ? `
                <div class="hotspot-ring" style="
                  position:absolute;top:50%;left:50%;
                  width:${size}px;height:${size}px;border-radius:50%;
                  border:2px solid ${colors.stroke};pointer-events:none;
                "></div>
              ` : ''}
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
        interactive: true,
        zIndexOffset: 1000, // hotspots always on top of intersections
      });

      marker.on('click', () => onHotspotClick(hotspot));
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, hotspots, onHotspotClick]);

  return null;
}

/** Blurb markers as Leaflet overlays with hover tooltips */
function BlurbMarkers({
  blurbs,
}: {
  blurbs: Array<{ lat: number; lng: number; text: string }>;
}) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    blurbs.forEach((blurb) => {
      const isWarning = blurb.text.includes('HIGH') || blurb.text.includes('110%');
      const color = isWarning ? '#ef4444' : '#f59e0b';
      const shadowColor = isWarning ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.8)';

      const marker = L.marker([blurb.lat, blurb.lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              width:20px;height:20px;border-radius:50%;
              background:${color};border:2px solid ${color};
              box-shadow:0 0 12px ${shadowColor};opacity:0.85;
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        interactive: true,
        zIndexOffset: 500,
      });

      marker.bindTooltip(
        `<div style="
          font-family:ui-monospace,monospace;font-size:12px;
          background:rgba(2,6,23,0.95);border:1px solid #22d3ee;
          padding:6px 10px;
          color:${isWarning ? '#ef4444' : blurb.text.includes('OPEN') ? '#34d399' : '#fbbf24'};
        ">
          <div style="font-weight:700;color:#22d3ee;margin-bottom:2px;">ALERT</div>
          ${blurb.text}
        </div>`,
        { direction: 'right', offset: [12, 0], opacity: 1, className: 'blurb-tooltip' }
      );

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, blurbs]);

  return null;
}

// -------- main component --------

export function TacticalMap({
  dangerRoutes,
  safeRoutes,
  blurbs,
  hotspots,
  intersections,
  onHotspotClick,
}: TacticalMapProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const safeLatLngs = useMemo(
    () => safeRoutes.map((route) => route.map((pt) => [pt[0], pt[1]] as [number, number])),
    [safeRoutes]
  );

  const dangerLatLngs = useMemo(
    () => dangerRoutes.map((route) => route.map((pt) => [pt[0], pt[1]] as [number, number])),
    [dangerRoutes]
  );

  const handleZoomChange = useCallback((z: number) => setZoom(z), []);

  // Count visible intersections for the HUD
  const visibleCount = useMemo(() => {
    const minHeat = getMinHeatForZoom(zoom);
    return intersections.filter((i) => i.heat >= minHeat).length;
  }, [intersections, zoom]);

  const criticalCount = useMemo(
    () => intersections.filter((i) => i.threat_level === 'CRITICAL').length,
    [intersections]
  );

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#080c14' }}>
      {/* Map Title Overlay */}
      <motion.div
        className="absolute top-3 left-3 z-[1000] font-mono pointer-events-none"
// Component to render hotspots as HTML overlays
function HotspotOverlays({ hotspots, onHotspotClick }: { hotspots: Hotspot[]; onHotspotClick: (hotspot: Hotspot) => void }) {
  const map = useMap();
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  const updatePositions = () => {
    const newPositions = new Map<string, { x: number; y: number }>();
    hotspots.forEach((hotspot) => {
      const point = map.latLngToContainerPoint([hotspot.lat, hotspot.lng]);
      newPositions.set(hotspot.id, { x: point.x, y: point.y });
    });
    setPositions(newPositions);
  };

  useEffect(() => {
    updatePositions();
  }, [hotspots, map]);

  useMapEvents({
    move: updatePositions,
    zoom: updatePositions,
    zoomend: updatePositions,
    moveend: updatePositions
  });

  // Helper function to get hotspot size based on density (exponential scaling)
  const getHotspotSize = (density: number) => {
    const normalized = (density - 50) / 70;
    const exponential = Math.pow(normalized, 1.5);
    return 20 + (exponential * 40);
  };

  // Helper function to get hotspot color
  const getHotspotColor = (density: number) => {
    if (density > 90) return { bg: 'bg-red-500', border: 'border-red-600', shadow: 'rgba(239, 68, 68, 0.8)' };
    if (density > 70) return { bg: 'bg-amber-400', border: 'border-amber-500', shadow: 'rgba(245, 158, 11, 0.8)' };
    return { bg: 'bg-cyan-400', border: 'border-cyan-500', shadow: 'rgba(0, 255, 255, 0.8)' };
  };

  return (
    <>
      {hotspots.map((hotspot) => {
        const pos = positions.get(hotspot.id);
        if (!pos) return null;

        const size = getHotspotSize(hotspot.density_pct);
        const colors = getHotspotColor(hotspot.density_pct);
        const pulseIntensity = hotspot.density_pct > 90 ? 0.6 : hotspot.density_pct > 70 ? 0.4 : 0.2;

        return (
          <motion.div
            key={hotspot.id}
            className="absolute z-[600] hotspot-interactive pointer-events-auto"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, type: 'spring' }}
            onClick={() => onHotspotClick(hotspot)}
          >
            {/* Pulsing Hotspot Circle */}
            <motion.div
              className={`rounded-full ${colors.bg} ${colors.border} border-2`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                boxShadow: `0 0 ${size * 0.8}px ${colors.shadow}`
              }}
              animate={{
                opacity: [1 - pulseIntensity, 1, 1 - pulseIntensity],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Density Label */}
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-mono font-bold text-black text-sm pointer-events-none"
              style={{ textShadow: '0 0 4px rgba(255,255,255,0.5)' }}
            >
              {hotspot.density_pct}%
            </div>

            {/* Expanding Ring Effect for Critical */}
            {hotspot.status === 'CRITICAL' && (
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-500 pointer-events-none"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                }}
                animate={{
                  scale: [1, 1.8],
                  opacity: [0.8, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
              />
            )}
          </motion.div>
        );
      })}
    </>
  );
}

// Component to render blurbs as HTML overlays
function BlurbMarkers({ blurbs }: { blurbs: Array<{ lat: number; lng: number; text: string }> }) {
  const map = useMap();
  const [positions, setPositions] = useState<Map<number, { x: number; y: number }>>(new Map());

  const updatePositions = () => {
    const newPositions = new Map<number, { x: number; y: number }>();
    blurbs.forEach((blurb, index) => {
      const point = map.latLngToContainerPoint([blurb.lat, blurb.lng]);
      newPositions.set(index, { x: point.x, y: point.y });
    });
    setPositions(newPositions);
  };

  useEffect(() => {
    updatePositions();
  }, [blurbs, map]);

  useMapEvents({
    move: updatePositions,
    zoom: updatePositions,
    zoomend: updatePositions,
    moveend: updatePositions
  });

  return (
    <>
      {blurbs.map((blurb, index) => {
        const pos = positions.get(index);
        if (!pos) return null;

        const isWarning = blurb.text.includes('HIGH') || blurb.text.includes('110%');

        return (
          <motion.div
            key={`blurb-${index}`}
            className="absolute z-[500] cursor-pointer group pointer-events-auto"
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            {/* Marker */}
            <motion.div
              className={`w-6 h-6 rounded-full border-2 ${
                isWarning ? 'bg-red-500 border-red-600' : 'bg-amber-400 border-amber-500'
              }`}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                boxShadow: isWarning
                  ? '0 0 15px rgba(239, 68, 68, 0.8)'
                  : '0 0 15px rgba(245, 158, 11, 0.8)'
              }}
            />

            {/* Popup on hover */}
            <div className="absolute left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="border-2 border-cyan-400 bg-slate-700 bg-opacity-95 p-2 backdrop-blur-md whitespace-nowrap">
                <div className="font-mono text-xs">
                  <div className="font-bold text-cyan-400 mb-1">ALERT</div>
                  <div className={
                    isWarning ? 'text-red-500' :
                    blurb.text.includes('OPEN') ? 'text-emerald-400' :
                    'text-amber-400'
                  }>
                    {blurb.text}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}

// Component to set up map bounds and restrictions
function MapBounds() {
  const map = useMap();

  useEffect(() => {
    const bounds = new LatLngBounds(
      [47.585, -122.34],
      [47.615, -122.32]
    );
    map.setMaxBounds(bounds);
  }, [map]);

  return null;
}

export function TacticalMap({ dangerRoutes, safeRoutes, blurbs, hotspots, onHotspotClick }: TacticalMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  // Memoize traffic polylines
  const trafficPolylines = useMemo(() => {
    return LUMEN_FIELD_TRAFFIC.map((segment) => (
      <Polyline
        key={segment.id}
        positions={segment.coordinates}
        pathOptions={{
          color: segment.color,
          weight: 6,
          opacity: segment.opacity,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'traffic-segment'
        }}
      />
    ));
  }, []);

  // Memoize safe route polylines
  const safeRoutePolylines = useMemo(() => {
    return safeRoutes.map((route, index) => (
      <Polyline
        key={`safe-${index}`}
        positions={route as [number, number][]}
        pathOptions={{
          color: '#10b981',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          className: 'route-safe'
        }}
      />
    ));
  }, [safeRoutes]);

  // Memoize danger route polylines
  const dangerRoutePolylines = useMemo(() => {
    return dangerRoutes.map((route, index) => (
      <Polyline
        key={`danger-${index}`}
        positions={route as [number, number][]}
        pathOptions={{
          color: '#ef4444',
          weight: 5,
          opacity: 0.85,
          dashArray: '10, 10',
          lineCap: 'round',
          lineJoin: 'round',
          className: 'route-danger'
        }}
      />
    ));
  }, [dangerRoutes]);

  return (
    <div className="relative w-full h-full border-2 border-slate-600 overflow-hidden bg-slate-800">
      {/* Custom crosshair cursor style */}
      <style>{`
        .hotspot-interactive {
          cursor: crosshair;
        }
        .hotspot-interactive:hover {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="8" fill="none" stroke="cyan" stroke-width="2"/><line x1="16" y1="0" x2="16" y2="32" stroke="cyan" stroke-width="1"/><line x1="0" y1="16" x2="32" y2="16" stroke="cyan" stroke-width="1"/></svg>') 16 16, crosshair;
        }
      `}</style>

      {/* Map Title Overlay */}
      <motion.div
        className="absolute top-2 left-2 z-[1000] font-mono pointer-events-none"
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
          <div style={{ color: '#22d3ee', fontSize: '11px', marginBottom: '2px', letterSpacing: '0.1em' }}>
            TACTICAL
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>LUMEN FIELD</div>
          <div style={{ fontSize: '11px', marginTop: '2px', display: 'flex', gap: '6px' }}>
            {safeRoutes.length > 0 && (
              <span style={{ color: '#34d399' }}>{'SAFE:'}{safeRoutes.length}</span>
            )}
            {dangerRoutes.length > 0 && (
              <span style={{ color: '#ef4444' }}>{'DANGER:'}{dangerRoutes.length}</span>
            )}
            <span style={{ color: '#22d3ee' }}>{'INT:'}{visibleCount}/{intersections.length}</span>
            {criticalCount > 0 && (
              <span style={{ color: '#ef4444' }}>{'CRIT:'}{criticalCount}</span>
            )}
        <div className="border border-cyan-400 bg-slate-700 bg-opacity-90 p-1.5 backdrop-blur-sm">
          <div className="text-cyan-400 text-[8px] mb-0.5">TACTICAL</div>
          <div className="text-white font-bold text-[9px]">LUMEN FIELD</div>
          <div className="text-emerald-400 text-[7px] mt-0.5">
            {safeRoutes.length > 0 && <span className="mr-1">✓{safeRoutes.length}</span>}
            {dangerRoutes.length > 0 && <span className="text-red-500">⚠{dangerRoutes.length}</span>}
            {hotspots.length > 0 && <span className="ml-1">🎯{hotspots.length}</span>}
          </div>
        </div>
      </motion.div>

      {/* Zoom level indicator */}
      <div
        className="absolute top-3 right-3 z-[1000] font-mono pointer-events-none"
        style={{
          fontSize: '10px',
          color: 'rgba(34,211,238,0.5)',
          background: 'rgba(2,6,23,0.7)',
          padding: '4px 8px',
          border: '1px solid rgba(34,211,238,0.2)',
        }}
      >
        Z{zoom}
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={LUMEN_FIELD}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={false}
        style={{ width: '100%', height: '100%', background: '#080c14' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapUpdater routes={safeRoutes} />
        <ZoomTracker onZoomChange={handleZoomChange} />
        <StadiumMarker />

        {/* Intersection heat layer -- rendered BELOW hotspots */}
        <IntersectionHeatLayer intersections={intersections} zoom={zoom} />

        {/* Safe Routes */}
        {safeLatLngs.map((positions, i) => (
          <Polyline
            key={`safe-${i}`}
            positions={positions}
            pathOptions={{ color: '#10b981', weight: 4, opacity: 0.85, className: 'safe-route' }}
          />
        ))}

        {/* Danger Routes */}
        {dangerLatLngs.map((positions, i) => (
          <Polyline
            key={`danger-${i}`}
            positions={positions}
            pathOptions={{ color: '#ef4444', weight: 4, opacity: 0.85, dashArray: '12 8', className: 'danger-route' }}
          />
        ))}

        {/* Hotspot markers -- on top */}
        <HotspotMarkers hotspots={hotspots} onHotspotClick={onHotspotClick} />

        {/* Blurb alert markers */}
        <BlurbMarkers blurbs={blurbs} />
      </MapContainer>

      {/* Leaflet Map Container */}
      <MapContainer
        ref={mapRef}
        center={[47.5952, -122.3316]}
        zoom={14}
        minZoom={13}
        maxZoom={16}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', zIndex: 0 }}
        className="leaflet-container"
      >
        <MapBounds />

        {/* OpenStreetMap Standard Tile Layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        {/* Traffic Overlay */}
        {trafficPolylines}

        {/* Safe Routes */}
        {safeRoutePolylines}

        {/* Danger Routes */}
        {dangerRoutePolylines}

        {/* Hotspot Overlays */}
        <HotspotOverlays hotspots={hotspots} onHotspotClick={onHotspotClick} />

        {/* Blurb Markers */}
        <BlurbMarkers blurbs={blurbs} />
      </MapContainer>

      {/* CSS Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[100]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Scanline effect overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[999]"
        style={{
          background: `repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0, 255, 255, 0.015) 2px, rgba(0, 255, 255, 0.015) 4px
          )`,
        }}
      />

      {/* Scanning sweep line */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-[999] map-scan-line"
      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[999]"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,255,255,0.08) 50%, transparent 100%)',
          height: '80px',
        }}
      />

      {/* Bottom-left coordinates label */}
      <div
        className="absolute bottom-3 left-3 z-[500] font-mono pointer-events-none"
        style={{ fontSize: '11px', color: 'rgba(34,211,238,0.45)' }}
      >
        <div>47.5952 N</div>
        <div>122.3316 W</div>
      {/* Map Labels */}
      <div className="absolute bottom-2 left-2 z-[500] font-mono text-xs text-cyan-400 opacity-50 pointer-events-none">
        <div>47.5952°N</div>
        <div>122.3316°W</div>
      </div>
    </div>
  );
}
