import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScenarioSelector } from './ScenarioSelector';
import { TimelineSlider } from './TimelineSlider';
import { TacticalMap } from './TacticalMap';
import { AlertPanel } from './AlertPanel';
import { HotspotModal } from './HotspotModal';
import { Hotspot } from './mockData';
import { useFetchScenario } from '../hooks/useFetchScenario';

function getScenarioStartMinute(scenarioId: string, riskLevel: string): number {
  const loweredId = scenarioId.toLowerCase();
  if (loweredId.includes('blowout') || loweredId.includes('_c')) {
    return 1125;
  }
  if (loweredId.includes('high') || loweredId.includes('close') || loweredId.includes('_b')) {
    return 1200;
  }
  if (riskLevel === 'HIGH') {
    return 1125;
  }
  if (riskLevel === 'MEDIUM') {
    return 1200;
  }
  return 1140;
}

export function SafeTransitCommand() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [currentMinute, setCurrentMinute] = useState(1125); // Start at critical moment
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const { scenarioOptions, simulationData, isLoading, error, dataSource, refresh } =
    useFetchScenario(selectedScenarioId);

  const selectedScenarioIndex = useMemo(() => {
    if (!selectedScenarioId) {
      return 0;
    }
    const index = scenarioOptions.findIndex((scenario) => scenario.id === selectedScenarioId);
    return index >= 0 ? index : 0;
  }, [scenarioOptions, selectedScenarioId]);

  useEffect(() => {
    if (scenarioOptions.length === 0) {
      return;
    }
    const selectedExists = selectedScenarioId
      ? scenarioOptions.some((scenario) => scenario.id === selectedScenarioId)
      : false;
    if (!selectedScenarioId || !selectedExists) {
      const firstScenario = scenarioOptions[0];
      setSelectedScenarioId(firstScenario.id);
      setCurrentMinute(getScenarioStartMinute(firstScenario.id, firstScenario.risk_level));
    }
  }, [scenarioOptions, selectedScenarioId]);

  useEffect(() => {
    if (simulationData.timeline.length === 0) {
      return;
    }
    if (currentMinute >= simulationData.timeline.length) {
      setCurrentMinute(simulationData.timeline.length - 1);
    }
  }, [currentMinute, simulationData.timeline.length]);

  const handleScenarioChange = (index: number) => {
    const scenario = scenarioOptions[index];
    if (!scenario) {
      return;
    }
    setSelectedScenarioId(scenario.id);
    setCurrentMinute(getScenarioStartMinute(scenario.id, scenario.risk_level));
  };

  const timeline = simulationData.timeline;
  const clampedMinute = Math.max(0, Math.min(currentMinute, Math.max(0, timeline.length - 1)));
  const currentData = timeline[clampedMinute];

  const threatSeries = useMemo(
    () => timeline.map((minute) => minute.threat_score ?? 0),
    [timeline]
  );

  const alertHistory = useMemo(() => {
    const historyStart = Math.max(0, clampedMinute - 180);
    return timeline
      .slice(historyStart, clampedMinute + 1)
      .filter((frame) => (frame.severity ?? 1) >= 3)
      .filter((frame) => frame.alert_message && frame.alert_message !== 'ALL SYSTEMS NORMAL')
      .map((frame) => ({
        minute: frame.minute,
        timeLabel: frame.time_label,
        message: frame.alert_message,
        severity: frame.severity ?? 1,
      }))
      .reverse()
      .slice(0, 8);
  }, [clampedMinute, timeline]);

  if (!currentData) {
    return (
      <div className="w-full h-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="font-mono text-cyan-400 text-sm">Loading scenario timeline...</div>
      </div>
    );
  }
  
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
          <div className="font-mono text-xs text-slate-400 mt-0.5">
            {isLoading ? 'Loading cache...' : `Data source: ${dataSource.toUpperCase()}`}
            {error ? ` | ${error}` : ''}
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
            scenarios={scenarioOptions}
            selectedScenario={selectedScenarioIndex}
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
                key={`${selectedScenarioId ?? selectedScenarioIndex}-${clampedMinute}`}
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
              severity={currentData.severity}
              crowdVolume={currentData.estimated_crowd_volume}
              alertHistory={alertHistory}
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
            currentMinute={clampedMinute}
            onMinuteChange={setCurrentMinute}
            threatScore={currentData.threat_score}
            threatSeries={threatSeries}
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

      {error && (
        <button
          onClick={refresh}
          className="absolute bottom-3 right-3 z-[1200] text-xs font-mono text-amber-400 border border-amber-400 px-2 py-1 hover:bg-amber-400 hover:text-black transition-colors"
        >
          Retry API
        </button>
      )}
    </div>
  );
}
