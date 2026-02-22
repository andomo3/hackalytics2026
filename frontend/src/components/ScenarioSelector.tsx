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
                : 'border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
            style={{
              backgroundColor: isSelected
                ? scenario.risk_level === 'LOW' ? 'rgba(16, 185, 129, 0.15)'
                : scenario.risk_level === 'MEDIUM' ? 'rgba(251, 191, 36, 0.15)'
                : 'rgba(239, 68, 68, 0.15)'
                : 'rgba(51, 65, 85, 0.6)',
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
              <div className="font-mono text-[7px] mb-0.5 opacity-70">
                {String.fromCharCode(65 + index)}
              </div>
              <div className="font-mono font-bold text-[9px] mb-1 leading-tight">
                {scenario.name.split(' ')[0]}
              </div>
              <div className={`font-mono text-[7px] font-bold ${
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
