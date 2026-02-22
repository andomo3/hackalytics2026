# SafeTransit Command Center - Complete Build Guide

## CRITICAL INSTRUCTIONS

This is a COMPLETE, EXACT implementation guide. DO NOT modify, assume, or improvise ANYTHING. Copy ALL code EXACTLY as shown. NO placeholders, NO assumptions, NO deviations.

---

## Project Overview

SafeTransit is a tactical command center for preventing crowd crushes during the 2026 World Cup at Seattle's Lumen Field. The interface features:

- **Retro sci-fi aesthetic**: Green/cyan text, CRT effects, scanlines, terminal font
- **Landing Page**: Hero text and animated zoom transition to command center
- **Tactical Map**: 2D map with Canvas grid + HTML hotspot overlays
- **Timeline Scrubber**: 24-hour timeline slider to scrub through scenarios
- **Alert Panel**: Real-time AI reasoning log showing crowd safety recommendations
- **Scenario Selector**: Three scenario cards (Normal Game, High-Attendance, Blowout)
- **Hotspot Modals**: Detailed drill-down on crowd density at transit stations

---

## File Structure

Create EXACTLY these files in these locations:

```
/App.tsx
/components/LandingPage.tsx
/components/SafeTransitCommand.tsx
/components/HUDFrame.tsx
/components/TacticalMap.tsx
/components/TimelineSlider.tsx
/components/AlertPanel.tsx
/components/ScenarioSelector.tsx
/components/HotspotModal.tsx
/components/mockData.ts
/styles/globals.css
```

---

## File 1: /App.tsx

Copy this EXACTLY:

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { SafeTransitCommand } from './components/SafeTransitCommand';
import { HUDFrame } from './components/HUDFrame';
import { LandingPage } from './components/LandingPage';

export default function App() {
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  // ESC key listener to go back to landing page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCommandCenter) {
        setShowCommandCenter(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandCenter]);

  return (
    <div 
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #0a1a1a, #050f0f, #000000)'
      }}
    >
      {/* CRT Scanlines overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.03) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.03) 3px)',
          opacity: 0.4
        }}
      />

      {/* Subtle screen glow effect - reduced */}
      <motion.div 
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 255, 255, 0.05) 0%, transparent 60%)',
          filter: 'blur(40px)'
        }}
        animate={{ 
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Page Content with Transitions */}
      <AnimatePresence mode="wait">
        {!showCommandCenter ? (
          // Landing Page
          <motion.div
            key="landing"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ 
              opacity: 0,
              scale: 3,
              transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }
            }}
            className="fixed inset-0 z-20"
          >
            <LandingPage onEnter={() => setShowCommandCenter(true)} />
          </motion.div>
        ) : (
          // Command Center
          <motion.div
            key="command-center"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ 
              opacity: 1,
              scale: 1,
              transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96], delay: 0.2 }
            }}
            className="relative z-10"
          >
            {/* Exit Button */}
            <motion.button
              onClick={() => setShowCommandCenter(false)}
              className="fixed top-8 left-8 z-50 px-4 py-2 font-mono text-sm border-2 rounded-lg transition-all"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.5)',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#ef4444',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              whileHover={{
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 }}
            >
              ← EXIT
            </motion.button>

            {/* ESC Hint */}
            <motion.div
              className="fixed top-8 left-32 z-50 px-3 py-1 font-mono text-xs rounded"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: 'rgba(156, 163, 175, 0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              Press ESC
            </motion.div>

            {/* Main SafeTransit Interface */}
            <div className="w-full h-screen flex items-center justify-center px-24 pt-20 pb-16">
              <div className="w-full h-full max-w-[1920px]">
                <SafeTransitCommand />
              </div>
            </div>

            {/* HUD Frame with corner brackets and status */}
            <HUDFrame />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Footer */}
      <div 
        className="fixed bottom-0 left-0 right-0 border-t px-4 py-3 z-50"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTopColor: 'rgba(0, 255, 255, 0.2)'
        }}
      >
        <p 
          className="text-xs text-gray-400 text-center"
          style={{ fontFamily: 'Departure Mono, monospace' }}
        >
          Created in Figma Make by{' '}
          <a 
            href="https://x.com/hckmstrrahul" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors underline"
          >
            @hckmstrrahul
          </a>
          {' '}• Sep 2025
        </p>
      </div>
    </div>
  );
}
```

---

## File 2: /components/LandingPage.tsx

Copy this EXACTLY:

```tsx
import { motion } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* Hero Title */}
        <motion.h1
          className="font-mono text-8xl font-bold mb-6"
          style={{
            color: '#00ffff',
            textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4)'
          }}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          SAFETRANSIT
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="font-mono text-2xl text-emerald-400 mb-16"
          style={{ textShadow: '0 0 15px rgba(16, 185, 129, 0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          World Cup 2026 Tactical Command Center
        </motion.p>

        {/* Start Button */}
        <motion.button
          onClick={onEnter}
          className="font-mono text-2xl font-bold px-12 py-5 border-2 rounded-lg"
          style={{
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            color: '#00ffff',
          }}
          whileHover={{
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
            scale: 1.05,
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          ENTER COMMAND CENTER
        </motion.button>
      </div>
    </div>
  );
}
```

---

## File 3: /components/SafeTransitCommand.tsx

Copy this EXACTLY:

```tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScenarioSelector } from './ScenarioSelector';
import { TimelineSlider } from './TimelineSlider';
import { TacticalMap } from './TacticalMap';
import { AlertPanel } from './AlertPanel';
import { HotspotModal } from './HotspotModal';
import { scenarios, Hotspot } from './mockData';

export function SafeTransitCommand() {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [currentMinute, setCurrentMinute] = useState(1125); // Start at critical moment
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  
  const currentScenario = scenarios[selectedScenario];
  const currentData = currentScenario.timeline[currentMinute];
  
  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentMinute((prev) => {
        if (prev >= 1439) return 0;
        return prev + 1;
      });
    }, 100); // 100ms per minute = 2.4 minutes for full day
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  const handleScenarioChange = (index: number) => {
    setSelectedScenario(index);
    // Reset to a key moment for each scenario
    if (index === 0) setCurrentMinute(1140); // Normal game start
    if (index === 1) setCurrentMinute(1200); // High attendance mid-game
    if (index === 2) setCurrentMinute(1125); // Blowout critical moment
  };
  
  return (
    <div className="w-full h-full bg-slate-950 relative overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <motion.div
          className="border-b-2 border-cyan-400 bg-slate-950 px-3 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-mono text-lg font-bold text-cyan-400 tracking-wider">
            SAFETRANSIT
          </h1>
        </motion.div>
        
        {/* Scenario Selector */}
        <motion.div
          className="px-3 py-2 bg-slate-950 bg-opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ScenarioSelector
            scenarios={scenarios.map(s => s.scenario_metadata)}
            selectedScenario={selectedScenario}
            onSelectScenario={handleScenarioChange}
          />
        </motion.div>
        
        {/* Main Content Area - Map + Alert Panel */}
        <div className="flex-1 flex gap-2 px-3 pb-2 min-h-0">
          {/* Map Container */}
          <motion.div
            className="relative overflow-hidden flex-1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedScenario}-${currentMinute}`}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                className="h-full"
              >
                <TacticalMap
                  dangerRoutes={currentData.danger_routes}
                  safeRoutes={currentData.safe_routes}
                  blurbs={currentData.blurbs}
                  hotspots={currentData.hotspots}
                  onHotspotClick={setSelectedHotspot}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
          
          {/* Alert Panel */}
          <motion.div
            className="overflow-hidden w-[180px]"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <AlertPanel
              gameState={currentData.game_state}
              alertMessage={currentData.alert_message}
              threatScore={currentData.threat_score}
              timeLabel={currentData.time_label}
            />
          </motion.div>
        </div>
        
        {/* Timeline Slider - Fixed at bottom */}
        <motion.div
          className="border-t-2 border-slate-800"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.5 }}
        >
          <TimelineSlider
            currentMinute={currentMinute}
            onMinuteChange={setCurrentMinute}
            threatScore={currentData.threat_score}
          />
        </motion.div>
      </div>
      
      {/* Hotspot Modal */}
      {selectedHotspot && (
        <HotspotModal
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
          currentTime={currentData.time_label}
        />
      )}
    </div>
  );
}
```

---

## File 4: /components/HUDFrame.tsx

Copy this EXACTLY:

```tsx
export function HUDFrame() {
  return null;
}
```

---

## File 5: /components/TacticalMap.tsx

Copy this EXACTLY:

```tsx
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Hotspot } from './mockData';

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
        <div className="border border-cyan-400 bg-slate-950 bg-opacity-90 p-2 backdrop-blur-sm">
          <div className="text-cyan-400 text-xs mb-0.5">TACTICAL</div>
          <div className="text-white font-bold text-sm">LUMEN FIELD</div>
          <div className="text-emerald-400 text-xs mt-0.5">
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
                <div className="font-mono text-sm">
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
      <div className="absolute bottom-2 left-2 z-[500] font-mono text-xs text-cyan-400 opacity-50 pointer-events-none">
        <div>47.5952°N</div>
        <div>122.3316°W</div>
      </div>
    </div>
  );
}
```

---

## File 6: /components/TimelineSlider.tsx

Copy this EXACTLY:

```tsx
import { motion } from 'motion/react';

interface TimelineSliderProps {
  currentMinute: number;
  onMinuteChange: (minute: number) => void;
  threatScore: number;
}

export function TimelineSlider({ currentMinute, onMinuteChange, threatScore }: TimelineSliderProps) {
  const formatTime = (minute: number) => {
    const hour = Math.floor(minute / 60);
    const min = minute % 60;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  };

  const getThreatColor = () => {
    if (threatScore >= 0.8) return 'text-red-500';
    if (threatScore >= 0.6) return 'text-amber-400';
    if (threatScore >= 0.4) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const getThreatLabel = () => {
    if (threatScore >= 0.8) return 'CRITICAL';
    if (threatScore >= 0.6) return 'HIGH';
    if (threatScore >= 0.4) return 'ELEVATED';
    return 'NORMAL';
  };

  return (
    <div className="w-full px-6 py-4 border-2 border-slate-800 relative overflow-hidden"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none"
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
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="font-mono text-cyan-400 text-sm flex items-center gap-4">
            <span className="text-white font-bold">TIMELINE SCRUBBER</span>
            <span className="opacity-70">|</span>
            <span>
              TIME: <span className="text-emerald-400 font-bold">{formatTime(currentMinute)}</span>
            </span>
            <span className="opacity-70">|</span>
            <span>
              THREAT: <span className={`${getThreatColor()} font-bold`}>{getThreatLabel()}</span>
            </span>
            <span className="opacity-70">|</span>
            <span>
              SCORE: <span className={`${getThreatColor()} font-bold`}>{(threatScore * 100).toFixed(0)}%</span>
            </span>
          </div>
          
          {/* Pulsing indicator */}
          <motion.div
            className={`w-3 h-3 rounded-full ${
              threatScore >= 0.8 ? 'bg-red-500' :
              threatScore >= 0.6 ? 'bg-amber-400' :
              threatScore >= 0.4 ? 'bg-yellow-400' :
              'bg-emerald-400'
            }`}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        
        {/* Slider */}
        <div className="relative">
          {/* Time markers */}
          <div className="flex justify-between text-sm font-mono text-cyan-400 mb-2 opacity-60">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
          
          <input
            type="range"
            min="0"
            max="1439"
            value={currentMinute}
            onChange={(e) => onMinuteChange(parseInt(e.target.value))}
            className="w-full h-2 appearance-none cursor-pointer slider-timeline"
            style={{
              background: `linear-gradient(to right, 
                rgba(16, 185, 129, 0.3) 0%, 
                rgba(16, 185, 129, 0.3) ${(currentMinute / 1439) * 100}%, 
                rgba(71, 85, 105, 0.3) ${(currentMinute / 1439) * 100}%, 
                rgba(71, 85, 105, 0.3) 100%)`
            }}
          />
        </div>
      </div>
      
      <style>{`
        .slider-timeline::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #00ffff, #00ff00);
          border: 2px solid #0a0a0a;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
        
        .slider-timeline::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #00ffff, #00ff00);
          border: 2px solid #0a0a0a;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
        
        .slider-timeline::-webkit-slider-thumb:hover {
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}
```

---

## File 7: /components/AlertPanel.tsx

Copy this EXACTLY:

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from './mockData';

interface AlertPanelProps {
  gameState: GameState;
  alertMessage: string;
  threatScore: number;
  timeLabel: string;
}

export function AlertPanel({ gameState, alertMessage, threatScore, timeLabel }: AlertPanelProps) {
  const getThreatLevel = () => {
    if (threatScore >= 0.8) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500' };
    if (threatScore >= 0.6) return { label: 'HIGH', color: 'text-amber-400', bg: 'bg-amber-400' };
    if (threatScore >= 0.4) return { label: 'ELEVATED', color: 'text-yellow-400', bg: 'bg-yellow-400' };
    return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-400' };
  };

  const threat = getThreatLevel();

  return (
    <motion.div
      className="border border-slate-800 p-2 h-full overflow-y-auto relative"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)'
      }}
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Scanlines */}
      <div 
        className="absolute inset-0 pointer-events-none"
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
      
      <div className="relative z-10 space-y-2 font-mono">
        {/* Header */}
        <div className="border-b border-cyan-400 border-opacity-30 pb-1">
          <div className="text-cyan-400 font-bold text-sm">
            COMMAND
          </div>
        </div>
        
        {/* System Time */}
        <div className="space-y-0.5">
          <div className="text-xs text-slate-400">TIME</div>
          <div className="text-emerald-400 font-bold text-base tracking-wider">
            {timeLabel}
          </div>
        </div>
        
        {/* Game Status */}
        <div className="border border-slate-700 p-1.5 space-y-1">
          <div className="text-xs text-cyan-400 border-b border-slate-700 pb-0.5">
            GAME
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-slate-400">H</div>
              <div className="text-lg font-bold text-white">{gameState.home}</div>
            </div>
            <div className="text-slate-600 text-sm">-</div>
            <div>
              <div className="text-xs text-slate-400">A</div>
              <div className="text-lg font-bold text-white">{gameState.away}</div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Q{gameState.qtr}
          </div>
        </div>
        
        {/* Threat Level */}
        <div className="border border-slate-700 p-1.5 space-y-1">
          <div className="text-xs text-cyan-400 border-b border-slate-700 pb-0.5">
            THREAT
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              className={`w-3 h-3 rounded-full ${threat.bg}`}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <div className={`font-bold text-sm ${threat.color}`}>
              {threat.label}
            </div>
          </div>
          
          {/* Threat meter */}
          <div className="w-full h-1 bg-slate-800 overflow-hidden">
            <motion.div
              className={`h-full ${threat.bg}`}
              initial={{ width: 0 }}
              animate={{ width: `${threatScore * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        {/* AI Reasoning Log */}
        <div className="border border-slate-700 p-1.5 space-y-1">
          <div className="text-xs text-cyan-400 border-b border-slate-700 pb-0.5">
            AI LOG
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={alertMessage}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xs leading-tight">
                <span className={`${threat.color} font-bold`}>
                  {alertMessage.length > 80 ? alertMessage.substring(0, 80) + '...' : alertMessage}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## File 8: /components/ScenarioSelector.tsx

Copy this EXACTLY:

```tsx
import { motion } from 'motion/react';
import { ScenarioMetadata } from './mockData';

interface ScenarioSelectorProps {
  scenarios: ScenarioMetadata[];
  selectedScenario: number;
  onSelectScenario: (index: number) => void;
}

export function ScenarioSelector({ scenarios, selectedScenario, onSelectScenario }: ScenarioSelectorProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-emerald-400 border-emerald-500';
      case 'MEDIUM': return 'text-amber-400 border-amber-500';
      case 'HIGH': return 'text-red-500 border-red-500';
      default: return 'text-cyan-400 border-cyan-500';
    }
  };

  return (
    <div className="flex gap-2 w-full">
      {scenarios.map((scenario, index) => {
        const isSelected = selectedScenario === index;
        const riskColor = getRiskColor(scenario.risk_level);
        
        return (
          <motion.button
            key={scenario.id}
            onClick={() => onSelectScenario(index)}
            className={`flex-1 border p-2 relative overflow-hidden transition-all ${
              isSelected
                ? `${riskColor} bg-opacity-10 shadow-lg`
                : 'border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
            style={{
              backgroundColor: isSelected 
                ? scenario.risk_level === 'LOW' ? 'rgba(16, 185, 129, 0.1)'
                : scenario.risk_level === 'MEDIUM' ? 'rgba(251, 191, 36, 0.1)'
                : 'rgba(239, 68, 68, 0.1)'
                : 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(10px)'
            }}
            whileHover={{ scale: isSelected ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Scanline effect */}
            <div 
              className="absolute inset-0 pointer-events-none"
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
            
            {/* Pulsing border effect when selected */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 border-2"
                style={{ borderColor: 'currentColor' }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            <div className="relative z-10">
              <div className="font-mono text-xs mb-1 opacity-70">
                {String.fromCharCode(65 + index)}
              </div>
              <div className="font-mono font-bold text-sm mb-1.5 leading-tight">
                {scenario.name.split(' ')[0]}
              </div>
              <div className={`font-mono text-xs font-bold ${
                isSelected ? '' : 'text-slate-500'
              }`}>
                {scenario.risk_level}
              </div>
            </div>
            
            {/* Corner brackets - retro terminal style */}
            <div className="absolute top-1 left-1 w-2 h-2 border-l border-t" style={{ borderColor: 'currentColor', opacity: 0.5 }} />
            <div className="absolute top-1 right-1 w-2 h-2 border-r border-t" style={{ borderColor: 'currentColor', opacity: 0.5 }} />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-l border-b" style={{ borderColor: 'currentColor', opacity: 0.5 }} />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b" style={{ borderColor: 'currentColor', opacity: 0.5 }} />
          </motion.button>
        );
      })}
    </div>
  );
}
```

---

## File 9: /components/HotspotModal.tsx

Copy this EXACTLY (Part 1 of 2):

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { Hotspot } from './mockData';

interface HotspotModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  currentTime: string;
}

export function HotspotModal({ hotspot, onClose, currentTime }: HotspotModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  if (!hotspot) return null;
  
  const getStatusColor = (status: string) => {
    if (status === 'CRITICAL') return 'text-red-500 border-red-500';
    if (status === 'ELEVATED') return 'text-amber-400 border-amber-400';
    return 'text-emerald-400 border-emerald-400';
  };
  
  const getDensityColor = (density: number) => {
    if (density > 90) return 'bg-red-500';
    if (density > 70) return 'bg-amber-400';
    return 'bg-emerald-400';
  };
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2000] flex items-center justify-center font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-md" />
        
        {/* Modal Content */}
        <motion.div
          className="relative z-10 w-[600px] max-w-[90vw] bg-slate-950 bg-opacity-95 border-4 border-cyan-400 p-8 backdrop-blur-xl"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 0 60px rgba(0, 255, 255, 0.5), inset 0 0 60px rgba(0, 255, 255, 0.1)'
          }}
        >
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-cyan-400" />
          <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-cyan-400" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-cyan-400" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xl font-bold"
          >
            ×
          </button>
          
          {/* Header */}
          <div className="mb-6">
            <div className="text-cyan-400 text-xs mb-2">HOTSPOT ANALYSIS // {currentTime}</div>
            <h2 className="text-3xl font-bold text-white tracking-wider mb-2">
              {hotspot.name}
            </h2>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 border-2 ${getStatusColor(hotspot.status)} text-xs font-bold`}>
                {hotspot.status}
              </div>
              <div className="text-slate-400 text-sm">
                ID: {hotspot.id.toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Scanline Effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 255, 0.1) 2px,
                rgba(0, 255, 255, 0.1) 4px
              )`
            }}
          />
          
          {/* Current Density */}
          <div className="mb-6 relative z-10">
            <div className="text-slate-400 text-xs mb-2">CURRENT CAPACITY</div>
            <div className="flex items-end gap-4">
              <div className="text-6xl font-bold text-cyan-400">
                {hotspot.density_pct}
                <span className="text-2xl">%</span>
              </div>
              <div className={`text-lg font-bold mb-2 ${
                hotspot.density_pct > 100 ? 'text-red-500' :
                hotspot.density_pct > 90 ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                {hotspot.density_pct > 100 ? 'OVERCAPACITY' :
                 hotspot.density_pct > 90 ? 'NEAR CAPACITY' :
                 hotspot.density_pct > 70 ? 'HIGH TRAFFIC' :
                 'NORMAL FLOW'}
              </div>
            </div>
            
            {/* Visual Capacity Bar */}
            <div className="mt-4 h-8 bg-slate-900 border-2 border-slate-700 relative overflow-hidden">
              <motion.div
                className={`h-full ${getDensityColor(hotspot.density_pct)}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, hotspot.density_pct)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  boxShadow: hotspot.density_pct > 90 
                    ? '0 0 20px rgba(239, 68, 68, 0.8)' 
                    : hotspot.density_pct > 70
                    ? '0 0 20px rgba(245, 158, 11, 0.6)'
                    : '0 0 20px rgba(16, 185, 129, 0.6)'
                }}
              />
              {hotspot.density_pct > 100 && (
                <motion.div
                  className="absolute inset-0 bg-red-500 opacity-30"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            
            {/* Capacity Labels */}
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span className="text-amber-400">90%</span>
              <span className="text-red-500">100%</span>
            </div>
          </div>
          
          {/* Forecasted Density */}
          {hotspot.forecasted_density && (
            <div className="mb-6 relative z-10">
              <div className="text-slate-400 text-xs mb-2">FORECASTED (+30 MIN)</div>
              <div className="flex items-center gap-4 border-2 border-slate-800 bg-slate-900 bg-opacity-50 p-4">
                <div className="text-3xl font-bold text-amber-400">
                  {hotspot.forecasted_density}%
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">
                    {hotspot.forecasted_density > hotspot.density_pct ? (
                      <span className="text-red-500">▲ INCREASING</span>
                    ) : (
                      <span className="text-emerald-400">▼ DECREASING</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Δ {Math.abs(hotspot.forecasted_density - hotspot.density_pct)}% projected change
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* AI Recommendation */}
          {hotspot.recommended_action && (
            <div className="relative z-10">
              <div className="text-slate-400 text-xs mb-2">AI RECOMMENDATION</div>
              <div className={`border-2 p-4 ${
                hotspot.status === 'CRITICAL' ? 'border-red-500 bg-red-500 bg-opacity-10' :
                hotspot.status === 'ELEVATED' ? 'border-amber-400 bg-amber-400 bg-opacity-10' :
                'border-emerald-400 bg-emerald-400 bg-opacity-10'
              }`}>
                <motion.div
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={`text-2xl ${
                    hotspot.status === 'CRITICAL' ? 'text-red-500' :
                    hotspot.status === 'ELEVATED' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {hotspot.status === 'CRITICAL' ? '⚠' : hotspot.status === 'ELEVATED' ? '⚡' : '✓'}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${
                      hotspot.status === 'CRITICAL' ? 'text-red-500' :
                      hotspot.status === 'ELEVATED' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {hotspot.recommended_action}
                    </div>
                    {hotspot.status === 'CRITICAL' && (
                      <div className="text-xs text-slate-400 mt-2">
                        {'>'} Emergency rerouting protocols active
                        <br />
                        {'>'} Notify passengers via mobile alerts
                        <br />
                        {'>'} Station staff on high alert
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}
          
          {/* Footer Info */}
          <div className="mt-6 pt-4 border-t-2 border-slate-800 text-xs text-slate-500 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-600">COORDINATES</div>
                <div className="text-cyan-400 font-mono">
                  {hotspot.lat.toFixed(4)}°N, {Math.abs(hotspot.lng).toFixed(4)}°W
                </div>
              </div>
              <div>
                <div className="text-slate-600">LAST UPDATED</div>
                <div className="text-cyan-400">{currentTime}</div>
              </div>
            </div>
          </div>
          
          {/* Blinking Cursor */}
          <motion.div
            className="absolute bottom-4 right-4 text-cyan-400 text-xl"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            _
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## File 10: /components/mockData.ts

Copy this EXACTLY (Part 1 of 3):

```ts
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

export interface TimelineMinute {
  minute: number;
  time_label: string;
  game_state: GameState;
  threat_score: number;
  alert_message: string;
  danger_routes: number[][][];
  safe_routes: number[][][];
  blurbs: Array<{ lat: number; lng: number; text: string }>;
  hotspots: Hotspot[];
}

export interface ScenarioMetadata {
  id: string;
  name: string;
  attendance: number;
  description: string;
  risk_level: string;
}

export interface ScenarioData {
  scenario_metadata: ScenarioMetadata;
  timeline: TimelineMinute[];
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
```

---

## File 11: /styles/globals.css

Copy this EXACTLY:

```css
@custom-variant dark (&:is(.dark *));

:root {
  --font-size: 16px;
  --background: #ffffff;
  --foreground: oklch(0.145 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: #030213;
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.0058 264.53);
  --secondary-foreground: #030213;
  --muted: #ececf0;
  --muted-foreground: #717182;
  --accent: #e9ebef;
  --accent-foreground: #030213;
  --destructive: #d4183d;
  --destructive-foreground: #ffffff;
  --border: rgba(0, 0, 0, 0.1);
  --input: transparent;
  --input-background: #f3f3f5;
  --switch-background: #cbced4;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: #030213;
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/**
 * Base typography. This is not applied to elements which have an ancestor with a Tailwind text class.
 */
@layer base {
  :where(:not(:has([class*=" text-"]), :not(:has([class^="text-\"])))) {
    h1 {
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h2 {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h4 {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    p {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }

    label {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    button {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    input {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }
  }
}

html {
  font-size: var(--font-size);
}
```

---

## FINAL CHECKLIST

Before you finish, verify:

- [ ] ALL 11 files are created with EXACT code shown above
- [ ] NO modifications, NO assumptions, NO placeholders
- [ ] File paths match EXACTLY: `/App.tsx`, `/components/LandingPage.tsx`, etc.
- [ ] All imports use 'motion/react' NOT 'framer-motion'
- [ ] All code is copied EXACTLY character-for-character
- [ ] NO comments like "// rest of code" or "// same as before"

## DONE

This is the COMPLETE build. Copy it EXACTLY and the SafeTransit tactical command center will work perfectly.
