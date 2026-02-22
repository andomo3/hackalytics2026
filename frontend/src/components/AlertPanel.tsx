import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { GameState } from './types';

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
  severity?: number;
  crowdVolume?: number;
  alertHistory?: AlertHistoryEntry[];
  aiLogLines?: string[];
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
  aiLogLines = [],
}: AlertPanelProps) {
  const getThreatLevel = () => {
    if (threatScore >= 0.8) return { label: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500' };
    if (threatScore >= 0.6) return { label: 'HIGH', color: 'text-amber-400', bg: 'bg-amber-400' };
    if (threatScore >= 0.4) return { label: 'ELEVATED', color: 'text-yellow-400', bg: 'bg-yellow-400' };
    return { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-400' };
  };

  const threat = getThreatLevel();
  const resolvedSeverity = severity ?? (threatScore >= 0.8 ? 5 : threatScore >= 0.6 ? 4 : threatScore >= 0.4 ? 3 : threatScore >= 0.2 ? 2 : 1);
  const defaultLines = useMemo(
    () => (aiLogLines.length > 0 ? aiLogLines : [alertMessage]),
    [aiLogLines, alertMessage]
  );
  const [typedLines, setTypedLines] = useState<string[]>(defaultLines.map(() => ''));

  useEffect(() => {
    const targetLines = defaultLines;
    setTypedLines(targetLines.map(() => ''));
    if (targetLines.length === 0) {
      return;
    }

    let lineIndex = 0;
    let charIndex = 0;
    const lineBuffers = targetLines.map(() => '');

    const timer = window.setInterval(() => {
      const currentLine = targetLines[lineIndex] ?? '';
      if (charIndex < currentLine.length) {
        lineBuffers[lineIndex] = currentLine.slice(0, charIndex + 1);
        charIndex += 1;
        setTypedLines([...lineBuffers]);
        return;
      }

      lineIndex += 1;
      charIndex = 0;
      if (lineIndex >= targetLines.length) {
        window.clearInterval(timer);
      }
    }, 18);

    return () => window.clearInterval(timer);
  }, [defaultLines]);

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
          <div className="text-cyan-400 font-bold text-base tracking-wider">
            COMMAND CENTER
          </div>
        </div>
        
        {/* System Time */}
        <div className="space-y-0.5">
          <div className="text-sm text-slate-400">SYSTEM TIME</div>
          <div className="text-emerald-400 font-bold text-xl tracking-wider">
            {timeLabel}
          </div>
        </div>
        
        {/* Game Status */}
        <div className="border border-slate-700 p-2 space-y-1">
          <div className="text-sm text-cyan-400 border-b border-slate-700 pb-0.5">
            GAME STATUS
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-slate-400">HOME</div>
              <div className="text-2xl font-black text-white">{gameState.home}</div>
            </div>
            <div className="text-slate-600 text-lg">-</div>
            <div>
              <div className="text-sm text-slate-400">AWAY</div>
              <div className="text-2xl font-black text-white">{gameState.away}</div>
            </div>
          </div>
          <div className="text-sm text-slate-400 font-bold">
            Q{gameState.qtr} {'|'} {gameState.clock}
          </div>
        </div>
        
        {/* Threat Level */}
        <div className="border border-slate-700 p-2 space-y-1.5">
          <div className="text-sm text-cyan-400 border-b border-slate-700 pb-0.5">
            THREAT ASSESSMENT
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <motion.div
                className={`w-4 h-4 rounded-full ${threat.bg}`}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <div className={`font-black text-lg ${threat.color}`}>
                {threat.label}
              </div>
            </div>
            <div className={`text-sm font-bold ${threat.color}`}>
              {severityLabel(resolvedSeverity)}
            </div>
          </div>

          <div className="text-sm text-slate-400">
            Crowd est: <span className="text-white font-bold">{(crowdVolume ?? 0).toLocaleString()}</span>
          </div>

          {/* Threat meter */}
          <div className="w-full h-2 bg-slate-800 overflow-hidden">
            <motion.div
              className={`h-full ${threat.bg}`}
              initial={{ width: 0 }}
              animate={{ width: `${threatScore * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        
        {/* AI Reasoning Log */}
        <div className="border border-slate-700 p-2 space-y-1.5 flex-1 min-h-0 overflow-y-auto">
          <div className="text-sm text-cyan-400 border-b border-slate-700 pb-0.5 font-bold tracking-wide">
            AI REASONING LOG
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={alertMessage}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-sm leading-relaxed space-y-1.5">
                {typedLines.map((line, idx) => (
                  <div key={`typed-${idx}`}>
                    <span className="text-cyan-300 font-bold">{'> '}</span>
                    <span className={threatScore >= 0.8 ? 'text-red-400 font-bold' : 'text-cyan-300 font-bold'}>
                      {line.length > 160 ? `${line.substring(0, 160)}...` : line}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {alertHistory.length > 0 && (
            <div className="pt-1.5 border-t border-slate-700 space-y-1.5">
              {alertHistory.map((entry) => (
                <div key={`${entry.minute}-${entry.message}`} className="text-sm leading-snug">
                  <span className="text-slate-500">{entry.timeLabel}</span>{' '}
                  <span className={entry.severity >= 4 ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                    [{severityLabel(entry.severity)}]
                  </span>{' '}
                  <span className="text-slate-300">
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
