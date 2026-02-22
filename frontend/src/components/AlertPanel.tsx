import { motion, AnimatePresence } from 'motion/react';
import { GameState, Hotspot } from './types';

type AlertHistoryEntry = {
  minute: number;
  timeLabel: string;
  message: string;
  severity: number;
};

interface AlertPanelProps {
  gameState: GameState;
  alertMessage: string;
  threatScore: number;
  timeLabel: string;
<<<<<<< HEAD
  /** Top corridors by traffic saturation (for Phase 4b) */
  corridorHotspots?: Hotspot[];
}

export function AlertPanel({ gameState, alertMessage, threatScore, timeLabel, corridorHotspots = [] }: AlertPanelProps) {
=======
  severity?: number;
  crowdVolume?: number;
  alertHistory?: AlertHistoryEntry[];
}

function severityLabel(severity: number): string {
  if (severity >= 5) return 'SEV-5';
  if (severity >= 4) return 'SEV-4';
  if (severity >= 3) return 'SEV-3';
  if (severity >= 2) return 'SEV-2';
  return 'SEV-1';
}

export function AlertPanel({
  gameState,
  alertMessage,
  threatScore,
  timeLabel,
  severity,
  crowdVolume,
  alertHistory = [],
}: AlertPanelProps) {
>>>>>>> d6c5a15d277f052ed2be7b70979c005a2e6dc0ea
  const getThreatLevel = () => {
    if (threatScore >= 0.8) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500' };
    if (threatScore >= 0.6) return { label: 'HIGH', color: 'text-amber-400', bg: 'bg-amber-400' };
    if (threatScore >= 0.4) return { label: 'ELEVATED', color: 'text-yellow-400', bg: 'bg-yellow-400' };
    return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-400' };
  };

  const threat = getThreatLevel();
  const resolvedSeverity = severity ?? (threatScore >= 0.8 ? 5 : threatScore >= 0.6 ? 4 : threatScore >= 0.4 ? 3 : threatScore >= 0.2 ? 2 : 1);

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
          <div className="flex items-center justify-between gap-1.5">
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
            <div className={`text-xs font-bold ${threat.color}`}>
              {severityLabel(resolvedSeverity)}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Crowd est: <span className="text-white">{(crowdVolume ?? 0).toLocaleString()}</span>
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
        
        {/* Corridor saturation (traffic-based metrics) */}
        {corridorHotspots.length > 0 && (
          <div className="border border-slate-700 p-1.5 space-y-1">
            <div className="text-[7px] text-cyan-400 border-b border-slate-700 pb-0.5">
              CORRIDOR SATURATION
            </div>
            <div className="space-y-0.5">
              {corridorHotspots.slice(0, 3).map((h) => (
                <div key={h.id} className="flex justify-between text-[7px]">
                  <span className="text-slate-400 truncate max-w-[90px]">{h.name}</span>
                  <span className={
                    h.density_pct > 90 ? 'text-red-500 font-bold' :
                    h.density_pct > 70 ? 'text-amber-400' :
                    'text-emerald-400'
                  }>
                    {h.density_pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
                  {alertMessage.length > 160 ? alertMessage.substring(0, 160) + '...' : alertMessage}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {alertHistory.length > 0 && (
            <div className="pt-1 border-t border-slate-700 space-y-1">
              {alertHistory.map((entry) => (
                <div key={`${entry.minute}-${entry.message}`} className="text-xs leading-tight">
                  <span className="text-slate-500">{entry.timeLabel}</span>{' '}
                  <span className={entry.severity >= 4 ? 'text-red-500' : 'text-amber-400'}>
                    [{severityLabel(entry.severity)}]
                  </span>{' '}
                  <span className="text-slate-400">
                    {entry.message.length > 100 ? `${entry.message.substring(0, 100)}...` : entry.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
