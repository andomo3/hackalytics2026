import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Shield, MapPin, Zap, Radio, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

/* ───── animated dot-grid background ───── */
function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const dots: { x: number; y: number; baseAlpha: number }[] = [];
    const SPACING = 32;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      dots.length = 0;
      for (let x = 0; x < canvas.width; x += SPACING * devicePixelRatio) {
        for (let y = 0; y < canvas.height; y += SPACING * devicePixelRatio) {
          dots.push({ x, y, baseAlpha: 0.12 + Math.random() * 0.08 });
        }
      }
    }

    let mouseX = -1000;
    let mouseY = -1000;

    function onMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * devicePixelRatio;
      mouseY = (e.clientY - rect.top) * devicePixelRatio;
    }

    function draw(time: number) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const dot of dots) {
        const dx = dot.x - mouseX;
        const dy = dot.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / (180 * devicePixelRatio));
        const pulse = Math.sin(time * 0.001 + dot.x * 0.005 + dot.y * 0.005) * 0.04;
        const alpha = Math.min(1, dot.baseAlpha + proximity * 0.6 + pulse);
        const radius = (1.2 + proximity * 2) * devicePixelRatio;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ───── animated counter ───── */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, target, { duration: 2, ease: 'easeOut' });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [target, count, rounded]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ───── typing text effect ───── */
function TypedText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 40);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span className={className}>
      {displayed}
      <span className="animate-pulse" style={{ opacity: displayed.length < text.length ? 1 : 0 }}>
        {'_'}
      </span>
    </span>
  );
}

/* ───── feature card ───── */
function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}) {
  return (
    <motion.div
      className="group relative flex flex-col gap-4 p-6"
      style={{
        background: 'rgba(2, 6, 23, 0.6)',
        border: '1px solid rgba(34, 211, 238, 0.12)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 + index * 0.15, duration: 0.6 }}
      whileHover={{
        borderColor: 'rgba(34, 211, 238, 0.4)',
        background: 'rgba(2, 6, 23, 0.8)',
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: '40px',
          height: '40px',
          background: 'rgba(34, 211, 238, 0.08)',
          border: '1px solid rgba(34, 211, 238, 0.2)',
          color: '#22d3ee',
        }}
      >
        {icon}
      </div>
      <div>
        <h3
          className="font-mono text-sm font-bold tracking-wider mb-2"
          style={{ color: '#e2e8f0' }}
        >
          {title}
        </h3>
        <p className="font-mono text-xs leading-relaxed" style={{ color: '#64748b' }}>
          {description}
        </p>
      </div>
    </motion.div>
  );
}

/* ───── main landing page ───── */
export function LandingPage({ onEnter }: LandingPageProps) {
  const features = [
    {
      icon: <Shield size={20} />,
      title: 'AI THREAT DETECTION',
      description: 'XGBoost-powered models predict crowd density surges up to 30 minutes before they become dangerous.',
    },
    {
      icon: <MapPin size={20} />,
      title: 'REAL-TIME MAPPING',
      description: '40+ intersection heat markers with live clustering. Zoom-adaptive visibility filters critical zones.',
    },
    {
      icon: <Zap size={20} />,
      title: 'SMART ROUTING',
      description: 'Autonomous rerouting algorithms redirect pedestrian flow away from danger corridors in real-time.',
    },
    {
      icon: <Radio size={20} />,
      title: 'SCENARIO SIMULATION',
      description: 'Stress-test 3 crowd scenarios: normal egress, high attendance, and Q3 blowout surge events.',
    },
  ];

  return (
    <div
      className="relative w-full min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#020617' }}
    >
      {/* Dot grid background */}
      <DotGrid />

      {/* Radial glow behind hero */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ===== HERO SECTION ===== */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Status badge */}
        <motion.div
          className="font-mono text-xs tracking-widest mb-8 flex items-center gap-2"
          style={{
            color: '#22d3ee',
            background: 'rgba(34, 211, 238, 0.06)',
            border: '1px solid rgba(34, 211, 238, 0.15)',
            padding: '6px 16px',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span
            className="inline-block rounded-full"
            style={{
              width: '6px',
              height: '6px',
              background: '#22d3ee',
              boxShadow: '0 0 8px #22d3ee',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          HACKLYTICS 2026 // BEST AI FOR HUMAN SAFETY
        </motion.div>

        {/* Main title */}
        <motion.h1
          className="font-mono font-bold text-center leading-none tracking-tight"
          style={{
            fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            color: '#f8fafc',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          CROWD
          <span style={{ color: '#22d3ee' }}>SHIELD</span>
        </motion.h1>

        {/* Subtitle with typing effect */}
        <motion.div
          className="mt-6 font-mono text-center"
          style={{ maxWidth: '600px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <TypedText
            text="AI-powered crowd safety intelligence for FIFA World Cup 2026"
            className="text-base leading-relaxed"
            delay={1000}
          />
          <style>{`
            .animate-pulse { animation: pulse 1s step-end infinite; }
            @keyframes pulse { 50% { opacity: 0; } }
          `}</style>
        </motion.div>

        {/* Stats row */}
        <motion.div
          className="flex items-center gap-8 mt-10 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          {[
            { value: 72000, suffix: '+', label: 'CROWD CAPACITY' },
            { value: 40, suffix: '', label: 'INTERSECTIONS' },
            { value: 1440, suffix: '', label: 'TIMELINE MINUTES' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl font-bold"
                style={{ color: '#22d3ee' }}
              >
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs mt-1" style={{ color: '#475569', letterSpacing: '0.1em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          onClick={onEnter}
          className="group mt-12 font-mono text-sm font-bold tracking-wider flex items-center gap-3 transition-all"
          style={{
            padding: '14px 32px',
            color: '#020617',
            background: '#22d3ee',
            border: 'none',
          }}
          whileHover={{
            boxShadow: '0 0 30px rgba(34, 211, 238, 0.5), 0 0 60px rgba(34, 211, 238, 0.2)',
            scale: 1.02,
          }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          ENTER COMMAND CENTER
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>

      {/* ===== FEATURES GRID ===== */}
      <div className="relative z-10 px-6 pb-16">
        <div
          className="mx-auto grid grid-cols-1 gap-px"
          style={{
            maxWidth: '900px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            background: 'rgba(34, 211, 238, 0.08)',
          }}
        >
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} index={i} />
          ))}
        </div>
      </div>

      {/* Bottom separator line */}
      <div
        className="relative z-10 mx-auto"
        style={{
          width: '120px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)',
          marginBottom: '24px',
        }}
      />
    </div>
  );
}
