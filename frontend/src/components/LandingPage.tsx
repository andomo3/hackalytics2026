import { motion, useInView } from 'motion/react';
import { useEffect, useRef } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

/* ───── static dot-grid background ───── */
function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SPACING = 32;

    function draw() {
      if (!canvas || !ctx) return;
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const r = 1.2 * devicePixelRatio;
      for (let x = 0; x < canvas.width; x += SPACING * devicePixelRatio) {
        for (let y = 0; y < canvas.height; y += SPACING * devicePixelRatio) {
          const alpha = 0.12 + Math.random() * 0.06;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
          ctx.fill();
        }
      }
    }

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.6,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

/* ───── animated counter ───── */
function AnimCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const val = useRef(0);

  useEffect(() => {
    if (!isInView || !ref.current) return;
    const dur = 1800;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      val.current = Math.round(ease * target);
      if (ref.current) ref.current.textContent = val.current.toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [isInView, target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ───── bento cell wrapper ───── */
function BentoCell({
  children,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative font-mono overflow-hidden ${className}`}
      style={{
        background: 'rgba(2, 6, 23, 0.7)',
        border: '1px solid rgba(34, 211, 238, 0.08)',
        borderRadius: '8px',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.2)';
        e.currentTarget.style.boxShadow = '0 0 30px rgba(34, 211, 238, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </div>
  );
}

/* ───── status row ───── */
function StatusRow({ label, status, value }: { label: string; status: 'ONLINE' | 'ACTIVE' | 'STANDBY'; value: string }) {
  const color = status === 'ONLINE' ? '#22d3ee' : status === 'ACTIVE' ? '#10b981' : '#f59e0b';
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(34, 211, 238, 0.06)' }}>
      <span className="text-xs" style={{ color: '#94a3b8' }}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          <span style={{ color }}>{status}</span>
        </span>
        <span className="text-xs" style={{ color: '#64748b' }}>{value}</span>
      </div>
    </div>
  );
}

/* ───── main landing page ───── */
export function LandingPage({ onEnter }: LandingPageProps) {
  const aboutRef = useRef<HTMLDivElement>(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden"
      style={{ background: '#020617', height: '100%' }}
    >
      {/* Dot grid spans the entire page */}
      <DotGrid />

      {/* ===== HERO SECTION ===== */}
      <div
        className="relative w-full flex flex-col items-center justify-center"
        style={{ minHeight: '100vh' }}
      >

        {/* Radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '700px',
            height: '500px',
            background:
              'radial-gradient(ellipse at center, rgba(34,211,238,0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.h1
            className="font-mono font-bold text-center leading-none tracking-tight"
            style={{ fontSize: 'clamp(4rem, 12vw, 9rem)', color: '#f8fafc' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            CROWD
            <span style={{ color: '#22d3ee' }}>SHIELD</span>
          </motion.h1>

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
              boxShadow:
                '0 0 30px rgba(34, 211, 238, 0.5), 0 0 60px rgba(34, 211, 238, 0.2)',
              scale: 1.02,
            }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            ENTER COMMAND CENTER
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </motion.button>
        </div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToAbout}
          className="absolute font-mono text-xs tracking-widest flex flex-col items-center gap-2 transition-colors"
          style={{ bottom: '40px', color: '#475569' }}
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

      {/* ===== ABOUT -- BRUTALIST BENTO GRID ===== */}
      <div
        ref={aboutRef}
        className="relative w-full"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Section comment header */}
        <div
          className="font-mono text-left"
          style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px 0' }}
        >
          <motion.div
            className="flex items-center gap-4 mb-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-xs tracking-widest" style={{ color: '#334155' }}>{'// SECTION: RAW_DATA'}</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(34, 211, 238, 0.06)' }} />
          </motion.div>

          <div
            className="text-7xl font-bold"
            style={{ color: 'rgba(34, 211, 238, 0.04)', marginBottom: '40px' }}
          >
            002
          </div>
        </div>

        {/* Bento grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '8px',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px 96px',
          }}
        >
          {/* ---- Metrics row (4 cells spanning 3 cols each) ---- */}
          {[
            { label: 'Avg Latency', value: 4.2, suffix: 'ms', color: '#22d3ee' },
            { label: 'Intersections', value: 40, suffix: '+', color: '#10b981' },
            { label: 'Scenarios', value: 3, suffix: '', color: '#f59e0b' },
            { label: 'Max Capacity', value: 72000, suffix: '', color: '#22d3ee' },
          ].map((m) => (
            <BentoCell
              key={m.label}
              style={{ gridColumn: 'span 3', padding: '24px' }}
            >
              <div
                className="font-mono text-xs tracking-widest"
                style={{ color: '#475569', marginBottom: '12px', textAlign: 'left' }}
              >
                {m.label}
              </div>
              <div
                className="font-mono text-3xl font-bold"
                style={{ color: m.color, textAlign: 'left' }}
              >
                <AnimCounter target={m.value} suffix={m.suffix} />
              </div>
            </BentoCell>
          ))}

          {/* ---- Terminal cell (8 cols) ---- */}
          <BentoCell style={{ gridColumn: 'span 8', padding: '0' }}>
            {/* Terminal header bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                borderBottom: '1px solid rgba(34, 211, 238, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-mono text-xs font-bold" style={{ color: '#22d3ee' }}>crowdshield.sys</span>
                <span className="font-mono text-xs" style={{ color: '#334155' }}>_</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              </div>
            </div>
            {/* Terminal body */}
            <div className="font-mono text-xs" style={{ padding: '20px', lineHeight: '1.8', color: '#64748b', textAlign: 'left' }}>
              <div style={{ color: '#475569' }}>{'>'} initializing crowdshield v1.0.0...</div>
              <div style={{ color: '#475569' }}>{'>'} loading seattle traffic data (2018-2024)...</div>
              <div style={{ color: '#10b981' }}>{'>'} xgboost model loaded -- 94.2% accuracy</div>
              <div style={{ color: '#10b981' }}>{'>'} pydantic ai routing agent online</div>
              <div style={{ color: '#22d3ee' }}>{'>'} 40 intersection sensors calibrated</div>
              <div style={{ color: '#22d3ee' }}>{'>'} leaflet tactical map initialized</div>
              <div style={{ color: '#10b981' }}>{'>'} all systems nominal. ready for simulation.</div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#22d3ee' }}>$</span>
                <motion.span
                  style={{ color: '#94a3b8' }}
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                >
                  _
                </motion.span>
              </div>
            </div>
          </BentoCell>

          {/* ---- Status table (4 cols) ---- */}
          <BentoCell style={{ gridColumn: 'span 4', padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span className="font-mono text-xs font-bold tracking-wider" style={{ color: '#22d3ee' }}>scenario.status</span>
            </div>
            <StatusRow label="Normal Game" status="ONLINE" value="68K" />
            <StatusRow label="High Attendance" status="ACTIVE" value="72K+" />
            <StatusRow label="Q3 Blowout" status="STANDBY" value="72K+" />
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(34, 211, 238, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="font-mono text-xs" style={{ color: '#475569' }}>Threat Coverage</span>
                <span className="font-mono text-xs font-bold" style={{ color: '#22d3ee' }}>96%</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(34, 211, 238, 0.1)' }}>
                <motion.div
                  style={{ height: '100%', background: '#22d3ee' }}
                  initial={{ width: '0%' }}
                  whileInView={{ width: '96%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </BentoCell>

          {/* ---- Description cell (7 cols) ---- */}
          <BentoCell style={{ gridColumn: 'span 7', padding: '24px' }}>
            <div className="font-mono text-xs tracking-widest" style={{ color: '#334155', marginBottom: '16px', textAlign: 'left' }}>MANIFEST.md</div>
            <h3
              className="font-mono text-lg font-bold tracking-wide"
              style={{ color: '#e2e8f0', marginBottom: '16px', textAlign: 'left' }}
            >
              Infrastructure built for{' '}
              <span style={{ color: '#22d3ee' }}>crowd intelligence</span>
            </h3>
            <p
              className="font-mono text-xs"
              style={{ color: '#64748b', lineHeight: '1.7', marginBottom: '16px', textAlign: 'left' }}
            >
              When 72,000 fans exit a World Cup match simultaneously, crowd density surges create
              life-threatening conditions at key intersections. CrowdShield uses XGBoost predictions
              and Pydantic AI routing agents to model mass egress events and generate real-time
              rerouting recommendations -- transforming static crowd plans into adaptive intelligence.
            </p>
            <p className="font-mono text-xs" style={{ color: '#475569', lineHeight: '1.7', textAlign: 'left' }}>
              Built for the Hacklytics 2026 hackathon at Georgia Tech. Best AI for Human Safety track.
            </p>
          </BentoCell>

          {/* ---- Tech stack cell (5 cols) ---- */}
          <BentoCell style={{ gridColumn: 'span 5', padding: '20px' }}>
            <div className="font-mono text-xs font-bold tracking-wider" style={{ color: '#22d3ee', marginBottom: '16px', textAlign: 'left' }}>tech.stack</div>
            {[
              { name: 'React 18 + Vite', desc: 'Frontend runtime' },
              { name: 'Leaflet.js', desc: 'Dark tactical map' },
              { name: 'Framer Motion', desc: 'Fluid transitions' },
              { name: 'XGBoost', desc: 'Crowd density prediction' },
              { name: 'Pydantic AI', desc: 'Routing agent' },
              { name: 'FastAPI + SQLite', desc: 'Backend API' },
            ].map((t) => (
              <div
                key={t.name}
                className="font-mono text-xs"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid rgba(34, 211, 238, 0.04)',
                }}
              >
                <span style={{ color: '#94a3b8' }}>{t.name}</span>
                <span style={{ color: '#334155' }}>{t.desc}</span>
              </div>
            ))}
          </BentoCell>
        </div>

        {/* Bottom separator */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '64px' }}>
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
