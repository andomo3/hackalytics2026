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

export function CrowdShieldCommand({ onExit }: { onExit?: () => void }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [currentMinute, setCurrentMinute] = useState(1125);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const { scenarioOptions, simulationData, isLoading, error, dataSource, refresh } =
    useFetchScenario(selectedScenarioId);

  const selectedScenarioIndex = useMemo(() => {
    if (!selectedScenarioId) return 0;
    const index = scenarioOptions.findIndex((s) => s.id === selectedScenarioId);
    return index >= 0 ? index : 0;
  }, [scenarioOptions, selectedScenarioId]);

  useEffect(() => {
    if (scenarioOptions.length === 0) return;
    const selectedExists = selectedScenarioId
      ? scenarioOptions.some((s) => s.id === selectedScenarioId)
      : false;
    if (!selectedScenarioId || !selectedExists) {
      const first = scenarioOptions[0];
      setSelectedScenarioId(first.id);
      setCurrentMinute(getScenarioStartMinute(first.id, first.risk_level));
    }
  }, [scenarioOptions, selectedScenarioId]);

  useEffect(() => {
    if (simulationData.timeline.length === 0) return;
    if (currentMinute >= simulationData.timeline.length) {
      setCurrentMinute(simulationData.timeline.length - 1);
    }
  }, [currentMinute, simulationData.timeline.length]);

  const handleScenarioChange = (index: number) => {
    const scenario = scenarioOptions[index];
    if (!scenario) return;
    setSelectedScenarioId(scenario.id);
    setCurrentMinute(getScenarioStartMinute(scenario.id, scenario.risk_level));
  };

  const timeline = simulationData.timeline;
  const clampedMinute = Math.max(0, Math.min(currentMinute, Math.max(0, timeline.length - 1)));
  const currentData = timeline[clampedMinute];

  const threatSeries = useMemo(
    () => timeline.map((m) => m.threat_score ?? 0),
    [timeline]
  );

  const alertHistory = useMemo(() => {
    const start = Math.max(0, clampedMinute - 180);
    return timeline
      .slice(start, clampedMinute + 1)
      .filter((f) => (f.severity ?? 1) >= 3)
      .filter((f) => f.alert_message && f.alert_message !== 'ALL SYSTEMS NORMAL')
      .map((f) => ({
        minute: f.minute,
        timeLabel: f.time_label,
        message: f.alert_message,
        severity: f.severity ?? 1,
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
    <div className="w-full h-full bg-slate-950 relative overflow-hidden flex flex-col">
      {/* ===== Header Bar ===== */}
      <motion.div
        className="flex items-center justify-between border-b-2 border-cyan-400 px-4 py-2"
        style={{ backgroundColor: 'rgba(2, 6, 23, 0.95)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          {/* Exit button integrated into header */}
          {onExit && (
            <motion.button
              onClick={onExit}
              className="font-mono text-xs px-3 py-1 border rounded transition-all"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.5)',
                color: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
              }}
              whileHover={{
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
              }}
            >
              {'< EXIT'}
            </motion.button>
          )}

          <div>
            <h1 className="font-mono text-lg font-bold text-cyan-400 tracking-wider">
              CROWDSHIELD
            </h1>
            <div className="font-mono text-xs text-slate-400">
              {isLoading ? 'Loading cache...' : `Source: ${dataSource.toUpperCase()}`}
              {error ? ` | ${error}` : ''}
              <span className="ml-3 text-slate-500">ESC to exit</span>
            </div>
          </div>
        </div>

        {/* Current scenario badge in header */}
        {scenarioOptions[selectedScenarioIndex] && (
          <div className="font-mono text-right">
            <div className="text-xs text-slate-400">ACTIVE SCENARIO</div>
            <div className="text-sm text-cyan-300 font-bold">
              {scenarioOptions[selectedScenarioIndex].label}
            </div>
          </div>
        )}
      </motion.div>

      {/* ===== Scenario Selector ===== */}
      <motion.div
        className="px-4 py-2"
        style={{ backgroundColor: 'rgba(2, 6, 23, 0.6)' }}
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

      {/* ===== Main Content -- Map + Alert Panel ===== */}
      <div className="flex-1 flex gap-3 px-3 pb-2 min-h-0">
        {/* Map fills remaining space */}
        <motion.div
          className="relative overflow-hidden flex-1 min-h-0"
          style={{ borderRadius: '4px', border: '1px solid rgba(51, 65, 85, 0.5)' }}
          initial={{ opacity: 0, scale: 0.97 }}
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
                intersections={currentData.intersections ?? []}
                onHotspotClick={setSelectedHotspot}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Alert Panel -- widened from 180px to 320px */}
        <motion.div
          className="overflow-hidden"
          style={{ width: '320px', minWidth: '280px' }}
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

      {/* ===== Timeline Slider ===== */}
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

      {/* Hotspot Modal */}
      {selectedHotspot && (
        <HotspotModal
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
          currentTime={currentData.time_label}
        />
      )}

      {/* Retry button on error */}
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
