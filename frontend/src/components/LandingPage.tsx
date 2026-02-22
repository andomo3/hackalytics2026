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
      <div ref={aboutRef} className="relative z-10 w-full">
        {/* Section comment header */}
        <motion.div
          className="font-mono text-xs tracking-widest px-8 pt-16 pb-2 flex items-center gap-4"
          style={{ color: '#334155' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span>{'// SECTION: RAW_DATA'}</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(34, 211, 238, 0.06)' }} />
        </motion.div>

        <div
          className="font-mono text-7xl font-bold px-8 pb-10"
          style={{ color: 'rgba(34, 211, 238, 0.04)' }}
        >
          002
        </div>

        {/* Bento grid */}
        <div
          className="grid gap-px mx-auto px-6 pb-24"
          style={{
            maxWidth: '1200px',
            gridTemplateColumns: 'repeat(12, 1fr)',
            background: 'rgba(34, 211, 238, 0.03)',
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
              className="p-6"
              style={{ gridColumn: 'span 3' }}
            >
              <div className="text-xs tracking-widest mb-3" style={{ color: '#475569' }}>
                {m.label}
              </div>
              <div className="text-3xl font-bold" style={{ color: m.color }}>
                <AnimCounter target={m.value} suffix={m.suffix} />
              </div>
            </BentoCell>
          ))}

          {/* ---- Terminal cell (8 cols) ---- */}
          <BentoCell
            className="p-0"
            style={{ gridColumn: 'span 8' }}
          >
            {/* Terminal header bar */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderBottom: '1px solid rgba(34, 211, 238, 0.08)' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: '#22d3ee' }}>crowdshield.sys</span>
                <span className="text-xs" style={{ color: '#334155' }}>_</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
              </div>
            </div>
            {/* Terminal body */}
            <div className="p-5 text-xs leading-relaxed" style={{ color: '#64748b' }}>
              <div style={{ color: '#475569' }}>{'>'} initializing crowdshield v1.0.0...</div>
              <div style={{ color: '#475569' }}>{'>'} loading seattle traffic data (2018-2024)...</div>
              <div style={{ color: '#10b981' }}>{'>'} xgboost model loaded -- 94.2% accuracy</div>
              <div style={{ color: '#10b981' }}>{'>'} pydantic ai routing agent online</div>
              <div style={{ color: '#22d3ee' }}>{'>'} 40 intersection sensors calibrated</div>
              <div style={{ color: '#22d3ee' }}>{'>'} leaflet tactical map initialized</div>
              <div style={{ color: '#10b981' }}>{'>'} all systems nominal. ready for simulation.</div>
              <div className="mt-3 flex items-center gap-1">
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
          <BentoCell
            className="p-5"
            style={{ gridColumn: 'span 4' }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold tracking-wider" style={{ color: '#22d3ee' }}>scenario.status</span>
            </div>
            <StatusRow label="Normal Game" status="ONLINE" value="68K" />
            <StatusRow label="High Attendance" status="ACTIVE" value="72K+" />
            <StatusRow label="Q3 Blowout" status="STANDBY" value="72K+" />
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(34, 211, 238, 0.06)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: '#475569' }}>Threat Coverage</span>
                <span className="text-xs font-bold" style={{ color: '#22d3ee' }}>96%</span>
              </div>
              <div className="w-full h-1" style={{ background: 'rgba(34, 211, 238, 0.1)' }}>
                <motion.div
                  className="h-full"
                  style={{ background: '#22d3ee' }}
                  initial={{ width: '0%' }}
                  whileInView={{ width: '96%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          </BentoCell>

          {/* ---- Description cell (7 cols) ---- */}
          <BentoCell
            className="p-6"
            style={{ gridColumn: 'span 7' }}
          >
            <div className="text-xs tracking-widest mb-4" style={{ color: '#334155' }}>MANIFEST.md</div>
            <h3 className="text-lg font-bold tracking-wide mb-4" style={{ color: '#e2e8f0' }}>
              Infrastructure built for{' '}
              <span style={{ color: '#22d3ee' }}>crowd intelligence</span>
            </h3>
            <p className="text-xs leading-relaxed mb-4" style={{ color: '#64748b' }}>
              When 72,000 fans exit a World Cup match simultaneously, crowd density surges create
              life-threatening conditions at key intersections. CrowdShield uses XGBoost predictions
              and Pydantic AI routing agents to model mass egress events and generate real-time
              rerouting recommendations -- transforming static crowd plans into adaptive intelligence.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
              Built for the Hacklytics 2026 hackathon at Georgia Tech. Best AI for Human Safety track.
            </p>
          </BentoCell>

          {/* ---- Tech stack cell (5 cols) ---- */}
          <BentoCell
            className="p-5"
            style={{ gridColumn: 'span 5' }}
          >
            <div className="text-xs font-bold tracking-wider mb-4" style={{ color: '#22d3ee' }}>tech.stack</div>
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
                className="flex items-center justify-between py-1.5"
                style={{ borderBottom: '1px solid rgba(34, 211, 238, 0.04)' }}
              >
                <span className="text-xs" style={{ color: '#94a3b8' }}>{t.name}</span>
                <span className="text-xs" style={{ color: '#334155' }}>{t.desc}</span>
              </div>
            ))}
          </BentoCell>
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
