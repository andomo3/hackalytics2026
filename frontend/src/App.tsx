import { motion } from 'motion/react';
import { SafeTransitCommand } from './components/SafeTransitCommand';
import { HUDFrame } from './components/HUDFrame';

export default function App() {
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

      {/* Main SafeTransit Interface */}
      <div className="relative z-10 w-full h-screen px-24 pt-20 pb-16">
        <div className="w-full h-full">
          <SafeTransitCommand />
        </div>
      </div>

      {/* HUD Frame with corner brackets and status */}
      <HUDFrame />

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
          {' '}• Sep 2025
        </p>
      </div>
    </div>
  );
}
