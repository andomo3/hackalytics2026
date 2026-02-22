import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { CrowdShieldCommand } from './components/CrowdShieldCommand';
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
      className="h-screen w-full relative overflow-hidden"
      style={{
        background: 'radial-gradient(circle at center, #0a1a1a, #050f0f, #000000)',
      }}
    >
      {/* CRT Scanlines overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.03) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.03) 3px)',
          opacity: 0.4,
        }}
      />

      {/* Subtle screen glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background:
            'radial-gradient(circle at center, rgba(0, 255, 255, 0.05) 0%, transparent 60%)',
          filter: 'blur(40px)',
        }}
        animate={{ opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Page Content with Transitions */}
      <AnimatePresence mode="wait">
        {!showCommandCenter ? (
          <motion.div
            key="landing"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] },
            }}
            className="fixed inset-0 z-20"
          >
            <LandingPage onEnter={() => setShowCommandCenter(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="command-center"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                duration: 1.2,
                ease: [0.43, 0.13, 0.23, 0.96],
                delay: 0.2,
              },
            }}
            className="relative z-10 w-full h-full"
          >
            {/* Full-viewport command center -- no padding, no max-width */}
            <CrowdShieldCommand onExit={() => setShowCommandCenter(false)} />

            {/* HUD Frame overlay */}
            <HUDFrame />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
