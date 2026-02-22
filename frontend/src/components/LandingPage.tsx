import { motion } from 'motion/react';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        {/* Hero Title */}
        <motion.h1
          className="font-mono text-8xl font-bold mb-6"
          style={{
            color: '#00ffff',
            textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4)'
          }}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          CROWDSHIELD
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="font-mono text-2xl text-emerald-400 mb-16"
          style={{ textShadow: '0 0 15px rgba(16, 185, 129, 0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          World Cup 2026 Tactical Command Center
        </motion.p>

        {/* Start Button */}
        <motion.button
          onClick={onEnter}
          className="font-mono text-2xl font-bold px-12 py-5 border-2 rounded-lg"
          style={{
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            color: '#00ffff',
          }}
          whileHover={{
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)',
            scale: 1.05,
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          ENTER COMMAND CENTER
        </motion.button>
      </div>
    </div>
  );
}
