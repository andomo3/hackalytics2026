import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  direction: number;
}

export function AlienFloraAnalysis() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [vitalityLevel, setVitalityLevel] = useState(0);
  const [growthData, setGrowthData] = useState<number[]>([]);

  // Initialize particles
  useEffect(() => {
    const initialParticles: Particle[] = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 400,
      y: Math.random() * 300,
      size: Math.random() * 3 + 1,
      color: ['#ff00ff', '#00ffff', '#00ff00'][Math.floor(Math.random() * 3)],
      speed: Math.random() * 0.5 + 0.2,
      direction: Math.random() * Math.PI * 2
    }));
    setParticles(initialParticles);

    // Generate growth rate data
    const data = Array.from({ length: 50 }, () => Math.random() * 40 + 10);
    setGrowthData(data);
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + Math.cos(particle.direction) * particle.speed + 400) % 400,
        y: (particle.y + Math.sin(particle.direction) * particle.speed + 300) % 300,
        direction: particle.direction + (Math.random() - 0.5) * 0.1
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Animate vitality level
  useEffect(() => {
    const interval = setInterval(() => {
      setVitalityLevel(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const vitalityBars = Array.from({ length: 10 }, (_, i) => {
    const isActive = i < Math.floor(vitalityLevel / 10);
    let color = '#00ff00';
    if (i >= 6) color = '#ffff00';
    if (i >= 8) color = '#ff0000';
    
    return (
      <motion.div
        key={i}
        className="w-6 h-4 border border-cyan-400"
        style={{ backgroundColor: isActive ? color : 'transparent' }}
        animate={{ opacity: isActive ? [0.5, 1, 0.5] : 0.2 }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
    );
  });

  const heatMapGrid = Array.from({ length: 144 }, (_, i) => {
    const row = Math.floor(i / 12);
    const col = i % 12;
    const intensity = Math.sin((row + col) * 0.5 + Date.now() * 0.001) * 0.5 + 0.5;
    const hue = intensity * 120; // Green to red
    
    return (
      <motion.div
        key={i}
        className="w-3 h-3 border-[0.5px] border-gray-700"
        style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.01 }}
      />
    );
  });

  return (
    <div className="w-full h-full bg-black p-4 font-mono text-green-400 relative">
      {/* Main border */}
      <div className="w-full h-full border-2 border-green-400 relative">
        
        {/* Header */}
        <motion.div 
          className="border-b-2 border-green-400 p-2"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-lg tracking-wider">FLOWER SPECIMEN: X-42 FLORA</div>
          <motion.div 
            className="text-red-500 text-sm mt-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            WARNING: DNA SEQUENCES DETECTED...
          </motion.div>
        </motion.div>

        <div className="flex h-[calc(100%-60px)]">
          {/* Left panel - Alien Flora */}
          <div className="w-1/2 border-r-2 border-green-400 p-4 relative">
            <div className="text-cyan-400 mb-4 tracking-wider">ALIEN FLORA</div>
            
            {/* Flower container */}
            <div className="relative w-full h-64 flex items-center justify-center">
              {/* Animated particles */}
              {particles.map(particle => (
                <motion.div
                  key={particle.id}
                  className="absolute rounded-full"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    left: particle.x,
                    top: particle.y,
                  }}
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
                />
              ))}

              {/* Main flower - pixelated style */}
              <motion.div 
                className="relative"
                animate={{ 
                  scale: [1, 1.05, 1],
                  filter: ['hue-rotate(0deg)', 'hue-rotate(20deg)', 'hue-rotate(0deg)']
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <svg width="120" height="120" className="pixelated">
                  {/* Flower petals */}
                  <g transform="translate(60,60)">
                    {Array.from({ length: 8 }, (_, i) => (
                      <motion.g 
                        key={i}
                        transform={`rotate(${i * 45})`}
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                      >
                        <rect x="-3" y="-40" width="6" height="35" fill="#00ffff" />
                        <rect x="-5" y="-35" width="10" height="25" fill="#ff00ff" />
                        <rect x="-2" y="-30" width="4" height="20" fill="#00ff00" />
                      </motion.g>
                    ))}
                    {/* Center */}
                    <motion.circle 
                      cx="0" cy="0" r="8" 
                      fill="#ff00ff"
                      animate={{ r: [8, 12, 8] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <rect x="-6" y="-6" width="12" height="12" fill="#00ffff" opacity="0.7" />
                  </g>
                  {/* Stem */}
                  <rect x="57" y="80" width="6" height="20" fill="#00ff00" />
                </svg>
              </motion.div>
            </div>

            {/* Technical readout */}
            <div className="text-xs space-y-1 mt-4 text-cyan-400">
              <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
                LOOPSEIVAUS: OF FATER/FURA SECQUECESIETTH:L-TAI
              </motion.div>
              <div className="text-green-400">DNIVIS EOLUDS ESPIAETQE</div>
              <div className="text-cyan-400">LARAEIONS: ONT*PEECIEMS</div>
              <div className="text-green-400">CONSTIING: DAELL DOSEM C_REMSID</div>
              <div className="text-cyan-400">SEGENUFGAD: DAISEEILUM EMEYGHALER ANE DETEFTDR</div>
              <div className="text-red-400">WARNINING: ALEAIDGIA IRAVAMEEEH DETLNTEN LY</div>
              <div className="text-green-400">RIEB-ECEES OLIS VHEIDGOOD</div>
              <div className="text-red-400 mt-2">DNSS FFALIEMOMEDS DNS S.GAS 45 DLT KTA.?</div>
              <div className="text-cyan-400">LAREERING: IEMS DNS AYEM-ECH NF NSARCUS IC LOON</div>
              <div className="text-cyan-400">DOPIFEDNG: IC OD EFOSOLO</div>
              <motion.div 
                className="text-cyan-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                WORINTNG: PLICOALTH DNA SEQUENCES DETECTED.
              </motion.div>
            </div>
          </div>

          {/* Right panels */}
          <div className="w-1/2 flex flex-col">
            {/* Vitality */}
            <div className="h-1/4 border-b-2 border-green-400 p-4">
              <div className="text-cyan-400 mb-2 tracking-wider">VITALITY</div>
              <div className="flex gap-1 items-end">
                {vitalityBars}
                <span className="ml-2 text-red-400">LOW</span>
              </div>
            </div>

            {/* Toxicity */}
            <div className="h-1/4 border-b-2 border-green-400 p-4">
              <div className="text-cyan-400 mb-2 tracking-wider">TOXICITY</div>
              <div className="relative w-24 h-24">
                <svg width="96" height="96" className="absolute">
                  {/* Radar grid */}
                  <motion.g 
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <circle cx="48" cy="48" r="12" fill="none" stroke="#00ff00" strokeWidth="1" />
                    <circle cx="48" cy="48" r="24" fill="none" stroke="#00ff00" strokeWidth="1" />
                    <circle cx="48" cy="48" r="36" fill="none" stroke="#00ff00" strokeWidth="1" />
                    <line x1="48" y1="12" x2="48" y2="84" stroke="#00ff00" strokeWidth="1" />
                    <line x1="12" y1="48" x2="84" y2="48" stroke="#00ff00" strokeWidth="1" />
                  </motion.g>
                  {/* Toxic indicator */}
                  <motion.polygon
                    points="48,20 65,40 48,60 31,40"
                    fill="#ff0000"
                    animate={{ 
                      scale: [0.8, 1.2, 0.8],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </svg>
              </div>
            </div>

            {/* Growth Rate */}
            <div className="h-1/4 border-b-2 border-green-400 p-4">
              <div className="text-cyan-400 mb-2 tracking-wider">GROWTH RATE</div>
              <div className="h-12 relative">
                <svg width="180" height="48" className="absolute">
                  <motion.polyline
                    points={growthData.map((val, i) => `${i * 3.6},${48 - val * 0.8}`).join(' ')}
                    fill="none"
                    stroke="#00ff00"
                    strokeWidth="1"
                    animate={{ strokeDasharray: ['0 1000', '1000 0'] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                </svg>
              </div>
            </div>

            {/* Radiation Absorption */}
            <div className="h-1/4 p-4">
              <div className="text-cyan-400 mb-2 tracking-wider">RADIATION ABSORPTION</div>
              <div className="grid grid-cols-12 gap-[1px] w-fit">
                {heatMapGrid}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanning line effect */}
      <motion.div
        className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400"
        animate={{ y: [0, 800, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ opacity: 0.3 }}
      />
    </div>
  );
}