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
      {/* CRT Effect - Full screen background */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 40, 40, 0.2), rgba(0, 0, 0, 0.8))',
        }}
      />
      
      {/* Vignette Effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1001]"
        style={{
          boxShadow: 'inset 0 0 100px 50px rgba(0, 0, 0, 0.8)',
        }}
      />
      
      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <motion.div
          className="border-b-2 border-cyan-400 bg-slate-950 bg-opacity-80 backdrop-blur-md px-3 py-2"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          <div className="flex items-center justify-between">
            <div className="font-mono">
              <h1 className="text-sm font-bold text-cyan-400 tracking-wider">
                SAFETRANSIT
              </h1>
              <p className="text-[8px] text-emerald-400">
                AI CROWD PREVENTION // 2026 WC
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <motion.button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-2 py-1 border font-mono text-[8px] ${
                  isPlaying
                    ? 'border-red-500 text-red-500 bg-red-500 bg-opacity-10'
                    : 'border-emerald-400 text-emerald-400 bg-emerald-400 bg-opacity-10'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? '⏸' : '▶'}
              </motion.button>
              
              {/* System Status */}
              <div className="flex items-center gap-1 font-mono text-[8px]">
                <motion.div
                  className="w-2 h-2 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-emerald-400">ONLINE</span>
              </div>
            </div>
          </div>
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
      
      {/* Corner decorations - retro terminal style */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-cyan-400 opacity-30 pointer-events-none z-[1000]" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-cyan-400 opacity-30 pointer-events-none z-[1000]" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-cyan-400 opacity-30 pointer-events-none z-[1000]" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-cyan-400 opacity-30 pointer-events-none z-[1000]" />
      
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
