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
      className="border border-slate-600 p-2 h-full overflow-y-auto relative"
      style={{
        backgroundColor: 'rgba(51, 65, 85, 0.85)',
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
          <div className="text-cyan-400 font-bold text-[9px]">
            COMMAND
          </div>
        </div>
        
        {/* System Time */}
        <div className="space-y-0.5">
          <div className="text-[7px] text-slate-400">TIME</div>
          <div className="text-emerald-400 font-bold text-[11px] tracking-wider">
            {timeLabel}
          </div>
        </div>
        
        {/* Game Status */}
        <div className="border border-slate-700 p-1.5 space-y-1">
          <div className="text-[7px] text-cyan-400 border-b border-slate-700 pb-0.5">
            GAME
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[7px] text-slate-400">H</div>
              <div className="text-sm font-bold text-white">{gameState.home}</div>
            </div>
            <div className="text-slate-600 text-xs">-</div>
            <div>
              <div className="text-[7px] text-slate-400">A</div>
              <div className="text-sm font-bold text-white">{gameState.away}</div>
            </div>
          </div>
          <div className="text-[7px] text-slate-400">
            Q{gameState.qtr}
          </div>
        </div>
        
        {/* Threat Level */}
        <div className="border border-slate-700 p-1.5 space-y-1">
          <div className="text-[7px] text-cyan-400 border-b border-slate-700 pb-0.5">
            THREAT
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div
              className={`w-2 h-2 rounded-full ${threat.bg}`}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <div className={`font-bold text-[8px] ${threat.color}`}>
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
          <div className="text-[7px] text-cyan-400 border-b border-slate-700 pb-0.5">
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
              <div className="text-[7px] leading-tight">
                <span className={`${threat.color} font-bold`}>
                  {alertMessage.length > 40 ? alertMessage.substring(0, 40) + '...' : alertMessage}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
