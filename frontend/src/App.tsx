import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { SafeTransitCommand } from './components/SafeTransitCommand';
import { HUDFrame } from './components/HUDFrame';
import { LandingPage } from './components/LandingPage';

export default function App() {
  const [showCommandCenter, setShowCommandCenter] = useState(false);

  // ESC key listener to go back to landing page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showCommandCenter) {
        setShowCommandCenter(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandCenter]);

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #2a3a3a, #1a2a2a, #0f1f1f)'
      }}
    >
      {/* CRT Scanlines overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.03) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.03) 3px)',
          opacity: 0.3
        }}
      />

      {/* Screen glow effect */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(circle at center, rgba(0, 255, 255, 0.05) 0%, transparent 70%)',
          filter: 'blur(40px)'
        }}
        animate={{
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Lighter vignette effect */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)',
          boxShadow: 'inset 0 0 200px rgba(0, 0, 0, 0.4)'
        }}
      />

      {/* Page Content with Transitions */}
      <AnimatePresence mode="wait">
        {!showCommandCenter ? (
          // Landing Page
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }
            }}
            className="fixed inset-0 z-20"
          >
            <LandingPage onEnter={() => setShowCommandCenter(true)} />
          </motion.div>
        ) : (
          // Command Center
          <motion.div
            key="command-center"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96], delay: 0.2 }
            }}
            className="relative z-10"
          >
            {/* Exit Button */}
            <motion.button
              onClick={() => setShowCommandCenter(false)}
              className="fixed top-8 left-8 z-50 px-4 py-2 font-mono text-sm border-2 rounded-lg transition-all"
              style={{
                borderColor: 'rgba(239, 68, 68, 0.5)',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#ef4444',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              whileHover={{
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5 }}
            >
              {'<- EXIT'}
            </motion.button>

            {/* ESC Hint */}
            <motion.div
              className="fixed top-8 left-32 z-50 px-3 py-1 font-mono text-xs rounded"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: 'rgba(156, 163, 175, 0.6)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
            >
              Press ESC
            </motion.div>

            {/* Main SafeTransit Interface */}
            <div className="w-full h-screen flex items-center justify-center px-24 pt-20 pb-16">
              <div className="w-full h-full max-w-[1920px]">
                <SafeTransitCommand />
              </div>
            </div>

            {/* HUD Frame with corner brackets and status */}
            <HUDFrame />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Footer */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t px-4 py-3 z-50"
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTopColor: 'rgba(0, 255, 255, 0.2)'
        }}
      >
        <p
          className="text-xs text-gray-400 text-center"
          style={{ fontFamily: 'Departure Mono, monospace' }}
        >
          Created in Figma Make by{' '}
          <a
            href="https://x.com/hckmstrrahul"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors underline"
          >
            @hckmstrrahul
          </a>
          {' '} - Sep 2025
        </p>
      </div>
    </div>
  );
}
