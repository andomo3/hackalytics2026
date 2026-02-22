import { motion } from 'motion/react';
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
  onHotspotClick: (hotspot: Hotspot) => void;
}

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
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-mono font-bold text-black text-xs pointer-events-none"
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
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.02) 2px,
            rgba(0, 255, 255, 0.02) 4px
          )`
        }}
      />

      {/* Scanning line effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[999]"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%)',
          height: '100px'
        }}
        animate={{
          y: ['-100px', 'calc(100% + 100px)']
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear'
        }}
      />

      {/* Map Labels */}
      <div className="absolute bottom-2 left-2 z-[500] font-mono text-[7px] text-cyan-400 opacity-50 pointer-events-none">
        <div>47.5952°N</div>
        <div>122.3316°W</div>
      </div>
    </div>
  );
}
