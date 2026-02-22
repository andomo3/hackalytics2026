import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ScenarioSelector } from './ScenarioSelector';
import { TimelineSlider } from './TimelineSlider';
import { TacticalMap } from './TacticalMap';
import { AlertPanel } from './AlertPanel';
import { TransitCapacityPanel } from './TransitCapacityPanel';
import { HotspotModal } from './HotspotModal';
import { Hotspot } from './mockData';
import { useFetchScenario } from '../hooks/useFetchScenario';
import { useDemoTimeline } from '../hooks/useDemoTimeline';

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

export function CrowdShieldCommand() {
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
  const selectedScenario = scenarioOptions[selectedScenarioIndex];
  const useStaticDemoTimeline =
    selectedScenario?.risk_level === 'HIGH' ||
    selectedScenario?.id?.toLowerCase().includes('blowout') ||
    false;
  const { data: demoData, loading: demoLoading, error: demoError } = useDemoTimeline(
    useStaticDemoTimeline
  );

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

  const activeData = useStaticDemoTimeline && demoData ? demoData : simulationData;
  const timeline = activeData.timeline;
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
      {/* ===== Scenario Selector ===== */}
      <motion.div
        className="px-4 py-2"
        style={{ backgroundColor: 'rgba(2, 6, 23, 0.6)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ScenarioSelector
              scenarios={scenarioOptions}
              selectedScenario={selectedScenarioIndex}
              onSelectScenario={handleScenarioChange}
            />
          </div>
          <div className="font-mono text-xs text-slate-500 flex items-center gap-3">
            <button
              onClick={() => setCurrentMinute(1125)}
              className="text-cyan-400 border border-cyan-500 px-2 py-0.5 hover:bg-cyan-500 hover:text-black transition-colors"
            >
              JUMP 18:45
            </button>
            {error && (
              <button
                onClick={refresh}
                className="text-amber-400 border border-amber-400 px-2 py-0.5 hover:bg-amber-400 hover:text-black transition-colors"
              >
                RETRY API
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ===== Main Content -- Map + Alert Panel ===== */}
      <div className="flex-1 flex gap-3 px-3 pb-2 min-h-0">
        <TransitCapacityPanel
          predictedSurgeVelocity={currentData.predicted_surge_velocity}
          criticalCapacityThreshold={currentData.critical_capacity_threshold}
          transitStatus={currentData.transit_status}
          timeLabel={currentData.time_label}
        />

        {/* Map fills remaining space -- NO AnimatePresence re-keying */}
        <motion.div
          className="relative overflow-hidden flex-1 min-h-0"
          style={{ borderRadius: '4px', border: '1px solid rgba(51, 65, 85, 0.5)' }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <TacticalMap
            dangerRoutes={currentData.danger_routes}
            safeRoutes={currentData.safe_routes}
            emergencyCorridors={currentData.emergency_corridors ?? []}
            transitStatus={currentData.transit_status}
            blurbs={currentData.blurbs}
            hotspots={currentData.hotspots}
            intersections={currentData.intersections ?? []}
            onHotspotClick={setSelectedHotspot}
          />
        </motion.div>

        {/* Alert Panel -- 360px wide for projector readability */}
        <motion.div
          className="overflow-hidden"
          style={{ width: '360px', minWidth: '320px' }}
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
            aiLogLines={currentData.ai_log_lines ?? []}
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


    </div>
  );
}
