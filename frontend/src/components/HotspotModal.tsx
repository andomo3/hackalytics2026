import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { Hotspot } from './mockData';

interface HotspotModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  currentTime: string;
}

export function HotspotModal({ hotspot, onClose, currentTime }: HotspotModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  if (!hotspot) return null;
  
  const getStatusColor = (status: string) => {
    if (status === 'CRITICAL') return 'text-red-500 border-red-500';
    if (status === 'ELEVATED') return 'text-amber-400 border-amber-400';
    return 'text-emerald-400 border-emerald-400';
  };
  
  const getDensityColor = (density: number) => {
    if (density > 90) return 'bg-red-500';
    if (density > 70) return 'bg-amber-400';
    return 'bg-emerald-400';
  };
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[2000] flex items-center justify-center font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black bg-opacity-80 backdrop-blur-md" />
        
        {/* Modal Content */}
        <motion.div
          className="relative z-10 w-[600px] max-w-[90vw] bg-slate-800 bg-opacity-95 border-4 border-cyan-400 p-8 backdrop-blur-xl"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            boxShadow: '0 0 60px rgba(0, 255, 255, 0.5), inset 0 0 60px rgba(0, 255, 255, 0.1)'
          }}
        >
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-cyan-400" />
          <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-cyan-400" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-cyan-400" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xl font-bold"
          >
            ×
          </button>
          
          {/* Header */}
          <div className="mb-6">
            <div className="text-cyan-400 text-xs mb-2">HOTSPOT ANALYSIS // {currentTime}</div>
            <h2 className="text-3xl font-bold text-white tracking-wider mb-2">
              {hotspot.name}
            </h2>
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 border-2 ${getStatusColor(hotspot.status)} text-xs font-bold`}>
                {hotspot.status}
              </div>
              <div className="text-slate-400 text-sm">
                ID: {hotspot.id.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Scanline Effect */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 255, 255, 0.1) 2px,
                rgba(0, 255, 255, 0.1) 4px
              )`
            }}
          />
          
          {/* Current Density */}
          <div className="mb-6 relative z-10">
            <div className="text-slate-400 text-xs mb-2">CURRENT CAPACITY</div>
            <div className="flex items-end gap-4">
              <div className="text-6xl font-bold text-cyan-400">
                {hotspot.density_pct}
                <span className="text-2xl">%</span>
              </div>
              <div className={`text-lg font-bold mb-2 ${
                hotspot.density_pct > 100 ? 'text-red-500' :
                hotspot.density_pct > 90 ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                {hotspot.density_pct > 100 ? 'OVERCAPACITY' :
                 hotspot.density_pct > 90 ? 'NEAR CAPACITY' :
                 hotspot.density_pct > 70 ? 'HIGH TRAFFIC' :
                 'NORMAL FLOW'}
              </div>
            </div>
            
            {/* Visual Capacity Bar */}
            <div className="mt-4 h-8 bg-slate-700 border-2 border-slate-600 relative overflow-hidden">
              <motion.div
                className={`h-full ${getDensityColor(hotspot.density_pct)}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, hotspot.density_pct)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                  boxShadow: hotspot.density_pct > 90 
                    ? '0 0 20px rgba(239, 68, 68, 0.8)' 
                    : hotspot.density_pct > 70
                    ? '0 0 20px rgba(245, 158, 11, 0.6)'
                    : '0 0 20px rgba(16, 185, 129, 0.6)'
                }}
              />
              {hotspot.density_pct > 100 && (
                <motion.div
                  className="absolute inset-0 bg-red-500 opacity-30"
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            
            {/* Capacity Labels */}
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span className="text-amber-400">90%</span>
              <span className="text-red-500">100%</span>
            </div>
          </div>
          
          {/* Forecasted Density */}
          {hotspot.forecasted_density && (
            <div className="mb-6 relative z-10">
              <div className="text-slate-400 text-xs mb-2">FORECASTED (+30 MIN)</div>
              <div className="flex items-center gap-4 border-2 border-slate-600 bg-slate-700 bg-opacity-50 p-4">
                <div className="text-3xl font-bold text-amber-400">
                  {hotspot.forecasted_density}%
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">
                    {hotspot.forecasted_density > hotspot.density_pct ? (
                      <span className="text-red-500">▲ INCREASING</span>
                    ) : (
                      <span className="text-emerald-400">▼ DECREASING</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Δ {Math.abs(hotspot.forecasted_density - hotspot.density_pct)}% projected change
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* AI Recommendation */}
          {hotspot.recommended_action && (
            <div className="relative z-10">
              <div className="text-slate-400 text-xs mb-2">AI RECOMMENDATION</div>
              <div className={`border-2 p-4 ${
                hotspot.status === 'CRITICAL' ? 'border-red-500 bg-red-500 bg-opacity-10' :
                hotspot.status === 'ELEVATED' ? 'border-amber-400 bg-amber-400 bg-opacity-10' :
                'border-emerald-400 bg-emerald-400 bg-opacity-10'
              }`}>
                <motion.div
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className={`text-2xl ${
                    hotspot.status === 'CRITICAL' ? 'text-red-500' :
                    hotspot.status === 'ELEVATED' ? 'text-amber-400' :
                    'text-emerald-400'
                  }`}>
                    {hotspot.status === 'CRITICAL' ? '⚠' : hotspot.status === 'ELEVATED' ? '⚡' : '✓'}
                  </div>
                  <div>
                    <div className={`font-bold text-sm ${
                      hotspot.status === 'CRITICAL' ? 'text-red-500' :
                      hotspot.status === 'ELEVATED' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      {hotspot.recommended_action}
                    </div>
                    {hotspot.status === 'CRITICAL' && (
                      <div className="text-xs text-slate-400 mt-2">
                        {'>'} Emergency rerouting protocols active
                        <br />
                        {'>'} Notify passengers via mobile alerts
                        <br />
                        {'>'} Station staff on high alert
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}
          
          {/* Footer Info */}
          <div className="mt-6 pt-4 border-t-2 border-slate-600 text-xs text-slate-400 relative z-10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-600">COORDINATES</div>
                <div className="text-cyan-400 font-mono">
                  {hotspot.lat.toFixed(4)}°N, {Math.abs(hotspot.lng).toFixed(4)}°W
                </div>
              </div>
              <div>
                <div className="text-slate-600">LAST UPDATED</div>
                <div className="text-cyan-400">{currentTime}</div>
              </div>
            </div>
          </div>

          {/* Blinking Cursor */}
          <motion.div
            className="absolute bottom-4 right-4 text-cyan-400 text-xl"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            _
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
