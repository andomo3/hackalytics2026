import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { CrowdShieldCommand } from './components/CrowdShieldCommand';
import { HUDFrame } from './components/HUDFrame';
import { LandingPage } from './components/LandingPage';
import { Shield } from 'lucide-react';

type Page = 'home' | 'command' | 'about';

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
    { page: 'about', label: 'ABOUT' },
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

function AboutPage() {
  return (
    <div
      className="w-full min-h-screen flex items-center justify-center px-6"
      style={{ background: '#020617', paddingTop: '48px' }}
    >
      <motion.div
        className="font-mono"
        style={{ maxWidth: '640px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1
          className="text-3xl font-bold tracking-wider mb-8"
          style={{ color: '#f8fafc' }}
        >
          ABOUT <span style={{ color: '#22d3ee' }}>CROWDSHIELD</span>
        </h1>

        <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
          <p>
            CrowdShield is an AI-driven crowd safety intelligence platform built for the
            2026 FIFA World Cup at Seattle{"'"}s Lumen Field. It models mass egress events
            using XGBoost prediction models and Pydantic AI routing agents to anticipate
            crowd density surges before they become dangerous.
          </p>

          <div
            style={{
              border: '1px solid rgba(34, 211, 238, 0.15)',
              background: 'rgba(34, 211, 238, 0.04)',
              padding: '16px',
            }}
          >
            <div className="text-xs tracking-widest mb-3" style={{ color: '#22d3ee' }}>
              HACKLYTICS 2026 SUBMISSION
            </div>
            <div className="text-xs" style={{ color: '#64748b' }}>
              Track: Best AI for Human Safety
            </div>
          </div>

          <div>
            <div className="text-xs tracking-widest mb-3" style={{ color: '#22d3ee' }}>
              TECHNICAL STACK
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#64748b' }}>
              {[
                'React 18 + Vite + TypeScript',
                'Leaflet.js Dark Tactical Map',
                'Framer Motion Animations',
                'FastAPI + SQLite Backend',
                'XGBoost Prediction Models',
                'Pydantic AI Routing Agent',
              ].map((tech) => (
                <div key={tech} className="flex items-center gap-2">
                  <span style={{ color: '#22d3ee' }}>{'>'}</span>
                  {tech}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs tracking-widest mb-3" style={{ color: '#22d3ee' }}>
              KEY FEATURES
            </div>
            <ul className="flex flex-col gap-2 text-xs" style={{ color: '#64748b' }}>
              <li>40+ real Seattle intersections with heat-based busyness indicators</li>
              <li>Zoom-adaptive marker clustering for multi-scale situational awareness</li>
              <li>3 stress-test scenarios: normal egress, high attendance, Q3 blowout</li>
              <li>1440-minute (24hr) timeline with threat-score sparkline</li>
              <li>AI-generated routing recommendations and reroute triggers</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // ESC key listener to go back to home
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
      {/* Navbar -- always visible */}
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* CRT Scanlines overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.03) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.03) 3px)',
          opacity: 0.4,
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
            className="fixed inset-0 z-20"
            style={{ paddingTop: '48px' }}
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
          >
            <CrowdShieldCommand />
            <HUDFrame />
          </motion.div>
        )}

        {currentPage === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-20 overflow-y-auto"
            style={{ paddingTop: '48px' }}
          >
            <AboutPage />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
