import { motion } from 'motion/react';
import { TransitStatus } from './mockData';

interface TransitCapacityPanelProps {
  predictedSurgeVelocity?: number;
  criticalCapacityThreshold?: number;
  transitStatus?: TransitStatus;
  timeLabel: string;
}

function severityColor(utilization: number): string {
  if (utilization >= 130) return 'text-red-500';
  if (utilization >= 110) return 'text-amber-400';
  if (utilization >= 90) return 'text-yellow-400';
  return 'text-emerald-400';
}

function severityBar(utilization: number): string {
  if (utilization >= 130) return 'bg-red-500';
  if (utilization >= 110) return 'bg-amber-400';
  if (utilization >= 90) return 'bg-yellow-400';
  return 'bg-emerald-400';
}

export function TransitCapacityPanel({
  predictedSurgeVelocity = 0,
  criticalCapacityThreshold = 133,
  transitStatus,
  timeLabel,
}: TransitCapacityPanelProps) {
  const utilization = Math.round(
    (predictedSurgeVelocity / Math.max(criticalCapacityThreshold, 1)) * 100
  );
  const isCritical = utilization >= 110 || transitStatus?.stadium_station === 'LOCKED_DOWN';
  const barWidth = Math.min(160, Math.max(0, utilization));
  const statusColor = severityColor(utilization);
  const statusBar = severityBar(utilization);

  return (
    <motion.div
      className="h-full border border-slate-800 p-3 relative overflow-hidden font-mono"
      style={{ width: '310px', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)' }}
      initial={{ opacity: 0, x: -80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.02) 2px, rgba(0, 255, 255, 0.02) 4px)',
        }}
      />

      <div className="relative z-10 space-y-3">
        <div className="border-b border-cyan-400 border-opacity-30 pb-1">
          <div className="text-cyan-400 font-bold text-base tracking-wide">DUAL-STREAM</div>
          <div className="text-xs text-slate-400 mt-0.5">TRANSIT SIMULATOR // {timeLabel}</div>
        </div>

        <div className="border border-slate-700 p-2.5 space-y-1.5">
          <div className="text-sm text-cyan-400 border-b border-slate-700 pb-1 font-bold">
            SURGE VELOCITY
          </div>
          <div className={`text-4xl font-black ${statusColor}`}>
            {predictedSurgeVelocity}
            <span className="text-base ml-1 text-slate-300">fans/min</span>
          </div>
          <div className="text-sm text-slate-400">
            Capacity threshold: <span className="text-white font-bold">{criticalCapacityThreshold}/min</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 overflow-hidden">
            <motion.div
              className={`h-full ${statusBar}`}
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className={`text-sm font-black ${statusColor}`}>
            UTILIZATION: {utilization}%
          </div>
        </div>

        <div className="border border-slate-700 p-2.5 space-y-1.5">
          <div className="text-sm text-cyan-400 border-b border-slate-700 pb-1 font-bold">STATION STATUS</div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Stadium Station</span>
            <span
              className={
                transitStatus?.stadium_station === 'LOCKED_DOWN'
                  ? 'text-red-400 font-black'
                  : 'text-emerald-400 font-bold'
              }
            >
              {transitStatus?.stadium_station ?? 'OPEN'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">King St Station</span>
            <span className="text-emerald-400 font-bold">{transitStatus?.king_st ?? 'OPEN'}</span>
          </div>
        </div>

        {isCritical && (
          <motion.div
            className="border-2 border-red-500 p-3 text-sm text-red-400 font-bold bg-red-500 bg-opacity-10"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            style={{ textShadow: '0 0 8px rgba(239,68,68,0.5)' }}
          >
            PLATFORM OVERLOAD DETECTED - LOCKDOWN RECOMMENDED
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

