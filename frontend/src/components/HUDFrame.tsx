import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export function HUDFrame() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <>
      {/* Corner Brackets - Top Left */}
      <motion.div
        className="fixed top-4 left-4 w-20 h-20 pointer-events-none z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Top horizontal */}
          <line x1="0" y1="2" x2="40" y2="2" stroke="#00ffff" strokeWidth="2" />
          {/* Left vertical */}
          <line x1="2" y1="0" x2="2" y2="40" stroke="#00ffff" strokeWidth="2" />
          {/* Corner detail */}
          <line x1="8" y1="8" x2="25" y2="8" stroke="#00ff88" strokeWidth="1" opacity="0.6" />
          <line x1="8" y1="8" x2="8" y2="25" stroke="#00ff88" strokeWidth="1" opacity="0.6" />
        </svg>
      </motion.div>

      {/* Corner Brackets - Top Right */}
      <motion.div
        className="fixed top-4 right-4 w-20 h-20 pointer-events-none z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Top horizontal */}
          <line x1="60" y1="2" x2="100" y2="2" stroke="#00ffff" strokeWidth="2" />
          {/* Right vertical */}
          <line x1="98" y1="0" x2="98" y2="40" stroke="#00ffff" strokeWidth="2" />
          {/* Corner detail */}
          <line x1="75" y1="8" x2="92" y2="8" stroke="#00ff88" strokeWidth="1" opacity="0.6" />
          <line x1="92" y1="8" x2="92" y2="25" stroke="#00ff88" strokeWidth="1" opacity="0.6" />
        </svg>
      </motion.div>

      {/* Corner Brackets - Bottom Left */}
      <motion.div
        className="fixed bottom-16 left-4 w-20 h-20 pointer-events-none z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Bottom horizontal */}
          <line x1="0" y1="98" x2="40" y2="98" stroke="#00ffff" strokeWidth="2" />
          {/* Left vertical */}
          <line x1="2" y1="60" x2="2" y2="100" stroke="#00ffff" strokeWidth="2" />
          {/* Corner detail */}
          <line x1="8" y1="92" x2="25" y2="92" stroke="#00ff88" strokeWidth="1" opacity="0.6" />
          <line x1="8" y1="75" x2="8" y2="92" stroke="#00ff88" strokeWidth="1" opacity="0.6" />
        </svg>
      </motion.div>

      {/* Corner Brackets - Bottom Right */}
      <motion.div
        className="fixed bottom-16 right-4 w-20 h-20 pointer-events-none z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Bottom horizontal */}
          <line x1="60" y1="98" x2="100" y2="98" stroke="#00ffff" strokeWidth="2" />
          {/* Right vertical */}
          <line x1="98" y1="60" x2="98" y2="100" stroke="#00ffff" strokeWidth="2" />
          {/* Corner detail */}
          <line x1="75" y1="92" x2="92" y2="92" stroke="#00ff88" strokeWidth="1" opacity="0.6" />
          <line x1="92" y1="75" x2="92" y2="92" stroke="#00ff88" strokeWidth="1" opacity="0.6" />
        </svg>
      </motion.div>

      {/* Top Status Bar */}
      <motion.div
        className="fixed top-2 left-1/2 -translate-x-1/2 px-6 py-1.5 pointer-events-none z-40"
        style={{
          fontFamily: 'Departure Mono, monospace',
          background: 'linear-gradient(90deg, transparent, rgba(30, 41, 59, 0.8), transparent)',
          borderTop: '1px solid rgba(0, 255, 255, 0.3)',
          borderBottom: '1px solid rgba(0, 255, 255, 0.3)'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <div className="flex items-center gap-6 text-xs">
          <span className="text-cyan-400 font-bold tracking-wider">SAFETRANSIT TACTICAL</span>
          <span className="text-gray-500">|</span>
          <span className="text-green-400">v2.1</span>
          <span className="text-gray-500">|</span>
          <span className="text-cyan-300">{formatDate(currentTime)}</span>
          <span className="text-gray-500">|</span>
          <motion.span
            className="text-green-400"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {formatTime(currentTime)}
          </motion.span>
          <span className="text-gray-500">|</span>
          <motion.span
            className="text-green-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ● ONLINE
          </motion.span>
        </div>
      </motion.div>

      {/* Side indicators - Left */}
      <motion.div
        className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none z-40"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-8 bg-cyan-400"
            style={{
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.6)'
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              height: ['20px', '32px', '20px']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </motion.div>

      {/* Side indicators - Right */}
      <motion.div
        className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none z-40"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-8 bg-cyan-400"
            style={{
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.6)'
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              height: ['20px', '32px', '20px']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </motion.div>
    </>
  );
}
