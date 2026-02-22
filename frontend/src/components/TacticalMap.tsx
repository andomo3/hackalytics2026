import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Hotspot } from './mockData';

// Lumen Field center coordinates
const LUMEN_FIELD: [number, number] = [47.5952, -122.3316];
const DEFAULT_ZOOM = 15;

interface TacticalMapProps {
  dangerRoutes: number[][][];
  safeRoutes: number[][][];
  blurbs: Array<{ lat: number; lng: number; text: string }>;
  hotspots: Hotspot[];
  onHotspotClick: (hotspot: Hotspot) => void;
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
              position:absolute;
              top:50%;left:50%;
              transform:translate(-50%,-50%);
              width:14px;height:14px;
              border-radius:50%;
              background:rgba(0,255,255,0.9);
              border:2px solid #00ffff;
            "></div>
            <div class="stadium-ring" style="
              position:absolute;
              top:50%;left:50%;
              width:28px;height:28px;
              border-radius:50%;
              border:2px solid rgba(0,255,255,0.5);
              pointer-events:none;
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
    // Clean up old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    hotspots.forEach((hotspot) => {
      const size = getHotspotSize(hotspot.density_pct);
      const colors = getHotspotColors(hotspot.density_pct);
      const isCritical = hotspot.status === 'CRITICAL';

      const marker = L.marker([hotspot.lat, hotspot.lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="position:relative;width:${size}px;height:${size}px;cursor:crosshair;">
              <div class="hotspot-marker" style="
                position:absolute;
                top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:${size}px;height:${size}px;
                border-radius:50%;
                background:${colors.fill};
                border:2px solid ${colors.stroke};
                --pulse-color:${colors.shadow};
                display:flex;
                align-items:center;
                justify-content:center;
              ">
                <span style="
                  font-family:ui-monospace,monospace;
                  font-size:${size > 30 ? '13px' : '11px'};
                  font-weight:700;
                  color:#000;
                  text-shadow:0 0 4px rgba(255,255,255,0.5);
                  pointer-events:none;
                ">${hotspot.density_pct}%</span>
              </div>
              ${isCritical ? `
                <div class="hotspot-ring" style="
                  position:absolute;
                  top:50%;left:50%;
                  width:${size}px;height:${size}px;
                  border-radius:50%;
                  border:2px solid ${colors.stroke};
                  pointer-events:none;
                "></div>
              ` : ''}
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
        interactive: true,
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
      const shadowColor = isWarning
        ? 'rgba(239,68,68,0.8)'
        : 'rgba(245,158,11,0.8)';

      const marker = L.marker([blurb.lat, blurb.lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div style="
              width:20px;height:20px;
              border-radius:50%;
              background:${color};
              border:2px solid ${color};
              box-shadow:0 0 12px ${shadowColor};
              opacity:0.85;
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        interactive: true,
      });

      marker.bindTooltip(
        `<div style="
          font-family:ui-monospace,monospace;
          font-size:12px;
          background:rgba(2,6,23,0.95);
          border:1px solid #22d3ee;
          padding:6px 10px;
          color:${isWarning ? '#ef4444' : blurb.text.includes('OPEN') ? '#34d399' : '#fbbf24'};
        ">
          <div style="font-weight:700;color:#22d3ee;margin-bottom:2px;">ALERT</div>
          ${blurb.text}
        </div>`,
        {
          direction: 'right',
          offset: [12, 0],
          opacity: 1,
          className: 'blurb-tooltip',
        }
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

// -------- helpers --------

function getHotspotSize(density: number): number {
  const normalized = Math.max(0, (density - 50) / 70);
  return 20 + Math.pow(normalized, 1.5) * 40;
}

function getHotspotColors(density: number) {
  if (density > 90) return { fill: '#ef4444', stroke: '#dc2626', shadow: 'rgba(239,68,68,0.7)' };
  if (density > 70) return { fill: '#fbbf24', stroke: '#f59e0b', shadow: 'rgba(245,158,11,0.7)' };
  return { fill: '#22d3ee', stroke: '#06b6d4', shadow: 'rgba(0,255,255,0.5)' };
}

// -------- main component --------

export function TacticalMap({
  dangerRoutes,
  safeRoutes,
  blurbs,
  hotspots,
  onHotspotClick,
}: TacticalMapProps) {
  // Convert route arrays to LatLngExpression arrays for react-leaflet
  const safeLatLngs = useMemo(
    () =>
      safeRoutes.map((route) =>
        route.map((pt) => [pt[0], pt[1]] as [number, number])
      ),
    [safeRoutes]
  );

  const dangerLatLngs = useMemo(
    () =>
      dangerRoutes.map((route) =>
        route.map((pt) => [pt[0], pt[1]] as [number, number])
      ),
    [dangerRoutes]
  );

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#080c14' }}>
      {/* Map Title Overlay */}
      <motion.div
        className="absolute top-3 left-3 z-[1000] font-mono pointer-events-none"
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
            {hotspots.length > 0 && (
              <span style={{ color: '#22d3ee' }}>{'ZONES:'}{hotspots.length}</span>
            )}
          </div>
        </div>
      </motion.div>

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
        {/* CartoDB Dark Matter tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapUpdater routes={safeRoutes} />
        <StadiumMarker />

        {/* Safe Routes -- solid green with glow */}
        {safeLatLngs.map((positions, i) => (
          <Polyline
            key={`safe-${i}`}
            positions={positions}
            pathOptions={{
              color: '#10b981',
              weight: 4,
              opacity: 0.85,
              className: 'safe-route',
            }}
          />
        ))}

        {/* Danger Routes -- dashed red with marching ants */}
        {dangerLatLngs.map((positions, i) => (
          <Polyline
            key={`danger-${i}`}
            positions={positions}
            pathOptions={{
              color: '#ef4444',
              weight: 4,
              opacity: 0.85,
              dashArray: '12 8',
              className: 'danger-route',
            }}
          />
        ))}

        {/* Hotspot interaction areas as invisible CircleMarkers for accessible hit zones */}
        <HotspotMarkers hotspots={hotspots} onHotspotClick={onHotspotClick} />

        {/* Blurb alert markers */}
        <BlurbMarkers blurbs={blurbs} />
      </MapContainer>

      {/* Scanline effect overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[999]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.015) 2px,
            rgba(0, 255, 255, 0.015) 4px
          )`,
        }}
      />

      {/* Scanning sweep line */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-[999] map-scan-line"
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
      </div>
    </div>
  );
}
