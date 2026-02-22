import { motion } from 'motion/react';

interface TimelineSliderProps {
  currentMinute: number;
  onMinuteChange: (minute: number) => void;
  threatScore: number;
  threatSeries?: number[];
}

function gradientColorForThreat(score: number): string {
  if (score >= 0.8) return 'rgba(239, 68, 68, 0.45)';
  if (score >= 0.6) return 'rgba(251, 191, 36, 0.45)';
  if (score >= 0.4) return 'rgba(250, 204, 21, 0.45)';
  return 'rgba(71, 85, 105, 0.35)';
}

function buildThreatTrackGradient(threatSeries: number[] | undefined): string {
  if (!threatSeries || threatSeries.length === 0) {
    return 'rgba(71, 85, 105, 0.3)';
  }

  const bucketSize = 15;
  const segments: string[] = [];
  for (let start = 0; start < 1440; start += bucketSize) {
    const end = Math.min(1439, start + bucketSize - 1);
    const bucket = threatSeries.slice(start, end + 1);
    const averageThreat =
      bucket.length > 0
        ? bucket.reduce((sum, value) => sum + value, 0) / bucket.length
        : 0;
    const color = gradientColorForThreat(averageThreat);
    const left = (start / 1439) * 100;
    const right = ((end + 1) / 1439) * 100;
    segments.push(`${color} ${left}% ${right}%`);
  }

  return `linear-gradient(to right, ${segments.join(', ')})`;
}

export function TimelineSlider({ currentMinute, onMinuteChange, threatScore, threatSeries }: TimelineSliderProps) {
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
              background: buildThreatTrackGradient(threatSeries)
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
