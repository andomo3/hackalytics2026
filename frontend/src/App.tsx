import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { CrowdShieldCommand } from './components/CrowdShieldCommand';
import { HUDFrame } from './components/HUDFrame';
import { LandingPage } from './components/LandingPage';
import { Shield } from 'lucide-react';

type Page = 'home' | 'command';

function Navbar({
  currentPage,
  onNavigate,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}) {
  const links: { page: Page; label: string }[] = [
    { page: 'home', label: 'HOME' },
    { page: 'command', label: 'COMMAND CENTER' },
  ];

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[2000] font-mono flex items-center justify-between px-6"
      style={{
        height: '48px',
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(34, 211, 238, 0.12)',
      }}
      initial={{ y: -48 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Logo */}
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 transition-colors"
        style={{ color: '#22d3ee' }}
      >
        <Shield size={18} />
        <span className="text-sm font-bold tracking-wider">CROWDSHIELD</span>
      </button>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {links.map((link) => {
          const isActive = currentPage === link.page;
          return (
            <button
              key={link.page}
              onClick={() => onNavigate(link.page)}
              className="relative px-4 py-1.5 text-xs tracking-wider transition-colors"
              style={{
                color: isActive ? '#22d3ee' : '#64748b',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget.style.color = '#94a3b8');
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget.style.color = '#64748b');
              }}
            >
              {link.label}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-2 right-2"
                  style={{ height: '1px', background: '#22d3ee' }}
                  layoutId="navbar-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentPage !== 'home') {
        setCurrentPage('home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  return (
    <div
      className="h-screen w-full relative overflow-hidden"
      style={{ background: '#020617' }}
    >
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* CRT Scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.03) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.03) 3px)',
          opacity: 0.4,
        }}
      />

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
        {currentPage === 'home' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-20 overflow-hidden"
            style={{ paddingTop: '48px' }}
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96] }
            }}
            className="fixed inset-0 z-20"
          >
            <LandingPage onEnter={() => setCurrentPage('command')} />
          </motion.div>
        )}

        {currentPage === 'command' && (
          <motion.div
            key="command-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full h-full"
            style={{ paddingTop: '48px' }}
            animate={{
              opacity: 1,
              transition: { duration: 1.2, ease: [0.43, 0.13, 0.23, 0.96], delay: 0.2 }
            }}
            className="relative z-10"
          >
            <CrowdShieldCommand />
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
