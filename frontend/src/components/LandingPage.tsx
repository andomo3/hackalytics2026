import { motion, useInView } from 'motion/react';
import { useEffect, useRef } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

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

/* ───── "What's New" style timeline entry ───── */
function TimelineEntry({
  label,
  tag,
  title,
  description,
  items,
  index,
}: {
  label: string;
  tag?: string;
  title: string;
  description?: string;
  items?: string[];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className="grid gap-6"
      style={{
        gridTemplateColumns: '140px 1px 1fr',
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
      }}
    >
      {/* Left: label + tag */}
      <div className="text-right pt-1">
        <div
          className="font-mono text-xs tracking-widest"
          style={{ color: '#64748b' }}
        >
          {label}
        </div>
        {tag && (
          <div
            className="inline-block font-mono text-xs mt-2 px-2 py-0.5"
            style={{
              color: '#22d3ee',
              border: '1px solid rgba(34, 211, 238, 0.25)',
              background: 'rgba(34, 211, 238, 0.06)',
            }}
          >
            {tag}
          </div>
        )}
      </div>

      {/* Center: vertical line + dot */}
      <div className="relative flex flex-col items-center">
        <div
          className="absolute top-2 rounded-full"
          style={{
            width: '7px',
            height: '7px',
            background: '#22d3ee',
            boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)',
          }}
        />
        <div
          className="w-px flex-1 mt-4"
          style={{ background: 'rgba(34, 211, 238, 0.12)' }}
        />
      </div>

      {/* Right: content card */}
      <div
        className="pb-10"
        style={{
          background: 'rgba(2, 6, 23, 0.5)',
          border: '1px solid rgba(34, 211, 238, 0.08)',
          padding: '20px 24px',
        }}
      >
        <h3
          className="font-mono text-sm font-bold tracking-wider mb-3"
          style={{ color: '#e2e8f0' }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="font-mono text-xs leading-relaxed mb-4"
            style={{ color: '#94a3b8' }}
          >
            {description}
          </p>
        )}
        {items && (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item}
                className="font-mono text-xs flex items-start gap-2"
                style={{ color: '#64748b' }}
              >
                <span style={{ color: '#22d3ee', marginTop: '2px' }}>{'>'}</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

/* ───── main landing page ───── */
export function LandingPage({ onEnter }: LandingPageProps) {
  const aboutRef = useRef<HTMLDivElement>(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const timelineEntries = [
    {
      label: 'THE PROBLEM',
      tag: 'WHY',
      title: 'MASS EGRESS IS UNPREDICTABLE',
      description:
        'When 72,000 fans exit a World Cup match simultaneously, crowd density surges create life-threatening conditions at key intersections. Traditional crowd management relies on static plans that cannot adapt in real-time.',
    },
    {
      label: 'OUR APPROACH',
      tag: 'HOW',
      title: 'AI-POWERED PREDICTION + ROUTING',
      items: [
        'XGBoost models trained on Seattle traffic data predict crowd density 30 min ahead',
        'Pydantic AI agents generate real-time rerouting recommendations',
        '40+ intersection sensors with heat-based busyness scoring',
        'Zoom-adaptive marker clustering for multi-scale awareness',
      ],
    },
    {
      label: 'SCENARIOS',
      tag: 'SIMULATE',
      title: 'THREE STRESS-TEST MODES',
      items: [
        'Normal Game -- Standard 68K attendance egress pattern',
        'High Attendance -- Sold-out 72K+ with elevated crowd pressure',
        'Q3 Blowout -- Early mass exit at the 90-min mark creating surge conditions',
      ],
    },
    {
      label: 'TECH STACK',
      tag: 'BUILD',
      title: 'FULL-STACK ARCHITECTURE',
      items: [
        'React 18 + Vite + TypeScript frontend',
        'Leaflet.js dark tactical map with real Seattle geography',
        'Framer Motion for fluid transitions and animations',
        'FastAPI + SQLite backend with XGBoost models',
        'Pydantic AI routing agent for autonomous rerouting',
      ],
    },
    {
      label: 'HACKLYTICS',
      tag: '2026',
      title: 'BEST AI FOR HUMAN SAFETY',
      description:
        'Built for the Hacklytics 2026 hackathon at Georgia Tech. CrowdShield demonstrates how predictive AI and real-time spatial intelligence can transform crowd safety for the largest sporting events on earth.',
    },
  ];

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden"
      style={{ background: '#020617', height: '100%' }}
    >
      {/* ===== HERO SECTION (full viewport) ===== */}
      <div className="relative w-full flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
        {/* Dot grid background */}
        <DotGrid />

        {/* Radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '500px',
            background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Main title */}
          <motion.h1
            className="font-mono font-bold text-center leading-none tracking-tight"
            style={{
              fontSize: 'clamp(4rem, 12vw, 9rem)',
              color: '#f8fafc',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            CROWD
            <span style={{ color: '#22d3ee' }}>SHIELD</span>
          </motion.h1>

          {/* CTA Button */}
          <motion.button
            onClick={onEnter}
            className="group font-mono text-sm font-bold tracking-wider flex items-center gap-3 transition-all mt-14"
            style={{
              padding: '16px 40px',
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
            transition={{ delay: 0.7 }}
          >
            ENTER COMMAND CENTER
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToAbout}
          className="absolute font-mono text-xs tracking-widest flex flex-col items-center gap-2 transition-colors"
          style={{
            bottom: '40px',
            color: '#475569',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          whileHover={{ color: '#22d3ee' }}
        >
          <span>SCROLL TO LEARN MORE</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown size={14} />
          </motion.div>
        </motion.button>
      </div>

      {/* ===== ABOUT / "WHAT'S NEW" SECTION ===== */}
      <div
        ref={aboutRef}
        className="relative w-full"
        style={{ background: '#020617' }}
      >
        {/* Section header */}
        <div className="flex flex-col items-center pt-24 pb-16">
          <motion.div
            className="font-mono text-xs tracking-widest mb-6"
            style={{ color: '#475569' }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            ABOUT THE PROJECT
          </motion.div>
          <div
            className="mx-auto"
            style={{
              width: '40px',
              height: '1px',
              background: 'rgba(34, 211, 238, 0.3)',
            }}
          />
        </div>

        {/* Timeline entries */}
        <div
          className="mx-auto px-6 pb-32"
          style={{ maxWidth: '720px' }}
        >
          {timelineEntries.map((entry, i) => (
            <TimelineEntry
              key={entry.label}
              label={entry.label}
              tag={entry.tag}
              title={entry.title}
              description={entry.description}
              items={entry.items}
              index={i}
            />
          ))}
        </div>

        {/* Bottom separator */}
        <div className="flex justify-center pb-16">
          <div
            style={{
              width: '80px',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
