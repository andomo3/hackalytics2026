import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Hotspot } from './types';

interface TacticalMapProps {
  dangerRoutes: number[][][];
  safeRoutes: number[][][];
  blurbs: Array<{ lat: number; lng: number; text: string }>;
  hotspots: Hotspot[];
  onHotspotClick: (hotspot: Hotspot) => void;
}

export function TacticalMap({ dangerRoutes, safeRoutes, blurbs, hotspots, onHotspotClick }: TacticalMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Convert lat/lng to canvas coordinates
  const latLngToXY = (lat: number, lng: number, width: number, height: number) => {
    // Lumen Field area bounds
    const minLat = 47.585;
    const maxLat = 47.615;
    const minLng = -122.34;
    const maxLng = -122.32;
    
    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - lat) / (maxLat - minLat)) * height;
    
    return { x, y };
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid background
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // Draw Lumen Field location
    const lumenField = latLngToXY(47.5952, -122.3316, width, height);
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(lumenField.x, lumenField.y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lumenField.x, lumenField.y, 15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw safe routes (green)
    safeRoutes.forEach((route) => {
      if (route.length < 2) return;
      
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
      ctx.shadowBlur = 8;
      
      ctx.beginPath();
      const start = latLngToXY(route[0][0], route[0][1], width, height);
      ctx.moveTo(start.x, start.y);
      
      for (let i = 1; i < route.length; i++) {
        const point = latLngToXY(route[i][0], route[i][1], width, height);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
    
    // Draw danger routes (red, dashed)
    dangerRoutes.forEach((route) => {
      if (route.length < 2) return;
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      
      ctx.beginPath();
      const start = latLngToXY(route[0][0], route[0][1], width, height);
      ctx.moveTo(start.x, start.y);
      
      for (let i = 1; i < route.length; i++) {
        const point = latLngToXY(route[i][0], route[i][1], width, height);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
    });
    
    setMapLoaded(true);
  }, [dangerRoutes, safeRoutes]);
  
  // Helper function to get hotspot size based on density (exponential scaling)
  const getHotspotSize = (density: number) => {
    // Base size at 50% = 20px, max size at 120% = 60px
    const normalized = (density - 50) / 70; // 0 to 1 range
    const exponential = Math.pow(normalized, 1.5); // Exponential curve
    return 20 + (exponential * 40);
  };
  
  // Helper function to get hotspot color
  const getHotspotColor = (density: number) => {
    if (density > 90) return { bg: 'bg-red-500', border: 'border-red-600', shadow: 'rgba(239, 68, 68, 0.8)' };
    if (density > 70) return { bg: 'bg-amber-400', border: 'border-amber-500', shadow: 'rgba(245, 158, 11, 0.8)' };
    return { bg: 'bg-cyan-400', border: 'border-cyan-500', shadow: 'rgba(0, 255, 255, 0.8)' };
  };
  
  // Convert lat/lng to percentage position for hotspots
  const latLngToPercent = (lat: number, lng: number) => {
    const minLat = 47.585;
    const maxLat = 47.615;
    const minLng = -122.34;
    const maxLng = -122.32;
    
    const left = ((lng - minLng) / (maxLng - minLng)) * 100;
    const top = ((maxLat - lat) / (maxLat - minLat)) * 100;
    
    return { left: `${left}%`, top: `${top}%` };
  };
  
  return (
    <div className="relative w-full h-full border-2 border-slate-800 overflow-hidden bg-slate-950">
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
        <div className="border border-cyan-400 bg-slate-950 bg-opacity-90 p-1.5 backdrop-blur-sm">
          <div className="text-cyan-400 text-[8px] mb-0.5">TACTICAL</div>
          <div className="text-white font-bold text-[9px]">LUMEN FIELD</div>
          <div className="text-emerald-400 text-[7px] mt-0.5">
            {safeRoutes.length > 0 && <span className="mr-1">✓{safeRoutes.length}</span>}
            {dangerRoutes.length > 0 && <span className="text-red-500">⚠{dangerRoutes.length}</span>}
            {hotspots.length > 0 && <span className="ml-1">🎯{hotspots.length}</span>}
          </div>
        </div>
      </motion.div>
      
      {/* Canvas Map */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Interactive Hotspots - HTML Overlay */}
      {hotspots.map((hotspot) => {
        const position = latLngToPercent(hotspot.lat, hotspot.lng);
        const size = getHotspotSize(hotspot.density_pct);
        const colors = getHotspotColor(hotspot.density_pct);
        const pulseIntensity = hotspot.density_pct > 90 ? 0.6 : hotspot.density_pct > 70 ? 0.4 : 0.2;
        
        return (
          <motion.div
            key={hotspot.id}
            className="absolute z-[600] hotspot-interactive"
            style={{
              left: position.left,
              top: position.top,
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
      
      {/* Blurb Markers */}
      {blurbs.map((blurb, index) => {
        const isWarning = blurb.text.includes('HIGH') || blurb.text.includes('110%');
        // Position markers based on lat/lng
        const position = (() => {
          if (blurb.lat === 47.5980) return { top: '45%', left: '52%' }; // Stadium Station
          if (blurb.lat === 47.5990) return { top: '42%', left: '58%' }; // King St
          return { top: '50%', left: '50%' };
        })();
        
        return (
          <motion.div
            key={`blurb-${index}`}
            className="absolute z-[500] cursor-pointer group"
            style={position}
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
              <div className="border-2 border-cyan-400 bg-slate-950 bg-opacity-95 p-2 backdrop-blur-md whitespace-nowrap">
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
