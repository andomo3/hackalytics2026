import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface UIData {
  title: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    warning: string;
  };
  panels: number;
  hasParticles: boolean;
  hasRadar: boolean;
  hasBarChart: boolean;
  hasLineGraph: boolean;
  hasHeatMap: boolean;
  animationSpeed: number;
  particleCount: number;
  layout?: string;
  centerElement?: number;
  hasWaveform?: boolean;
  hasSpectrum?: boolean;
  hasStatusGrid?: boolean;
  hasProgressRings?: boolean;
  hasDNAHelix?: boolean;
  hasOscilloscope?: boolean;
  hasWireframe3D?: boolean;
  hasNetworkTopology?: boolean;
  hasSignalAnalysis?: boolean;
  hasFrequencyBands?: boolean;
  hasDataStreams?: boolean;
  hasMatrixRain?: boolean;
  hasHologramGrid?: boolean;
  hasQuantumField?: boolean;
  hasEnergyPulse?: boolean;
  hasGravityWaves?: boolean;
  hasTimeDilation?: boolean;
  hasPlasmaBurst?: boolean;
  hasNeuralPaths?: boolean;
  hasCrystalLattice?: boolean;
  scanlineType?: string;
  glitchIntensity?: number;
  bloomEffect?: boolean;
  chromaShift?: boolean;
  scanSpeed?: number;
  pulseRate?: number;
  distortionLevel?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  direction: number;
}

interface DynamicRetroUIProps {
  uiData: UIData;
}

export function DynamicRetroUI({ uiData }: DynamicRetroUIProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationData, setAnimationData] = useState({
    vitalityLevel: 0,
    dataPoints: [] as number[],
    radarSweep: 0,
  });
  
  // Stable random data that doesn't change on every render
  const [stableData] = useState(() => ({
    dataLabels: {
      BAR: ['RADIATION LEVEL', 'ENERGY OUTPUT', 'STRUCTURAL INTEGRITY', 'THERMAL SIGNATURE', 'POWER DISTRIBUTION', 'SHIELD STRENGTH', 'HULL INTEGRITY', 'LIFE SUPPORT'],
      LINE: ['QUANTUM FLUX', 'BIO-SIGNATURES', 'ELECTROMAGNETIC', 'GRAVITATIONAL FIELD', 'NEURAL ACTIVITY', 'METABOLIC RATE', 'FREQUENCY SCAN', 'DATA THROUGHPUT'],
      HEAT: ['TEMPERATURE MAP', 'DENSITY FIELD', 'PRESSURE ZONES', 'MAGNETIC FIELD', 'PARTICLE DENSITY', 'ENERGY MATRIX', 'STRESS ANALYSIS', 'FLUX DENSITY'],
      RADAR: ['PROXIMITY SCAN', 'THREAT DETECT', 'NAVIGATION', 'TARGET LOCK', 'PERIMETER SWEEP', 'CONTACT TRACE', 'SECTOR SCAN', 'ORBITAL MAP'],
      WAVE: ['AUDIO SPECTRUM', 'BRAIN WAVES', 'SEISMIC DATA', 'RADIO SIGNAL', 'PULSE MONITOR', 'VIBRATION', 'OSCILLATION', 'RESONANCE'],
      SPEC: ['LIGHT SPECTRUM', 'CHEMICAL ANALYSIS', 'MATERIAL SCAN', 'MOLECULAR DATA', 'ELEMENT ID', 'COMPOUND MAP', 'ISOTOPE READ', 'CRYSTAL STRUCT'],
      GRID: ['SYSTEM STATUS', 'NODE NETWORK', 'CONNECTION MAP', 'RELAY STATUS', 'CIRCUIT GRID', 'PATHWAY MAP', 'JUNCTION BOX', 'CONTROL PANEL'],
      RING: ['PROCESS STATUS', 'LOADING DATA', 'SYSTEM BOOT', 'INITIALIZATION', 'CALIBRATION', 'SYNCHRONIZATION', 'OPTIMIZATION', 'COMPILATION']
    },
    selectedLabels: {
      BAR: '',
      LINE: '',
      HEAT: '',
      RADAR: '',
      WAVE: '',
      SPEC: '',
      GRID: '',
      RING: ''
    },
    statusMessages: [
      ['SYSTEM STATUS: OPERATIONAL', 'PROCESSING DATA STREAMS...', 'QUANTUM FLUX: STABLE', 'WARNING: ANOMALY DETECTED'],
      ['SPECIMEN ANALYSIS: ACTIVE', 'CELLULAR STRUCTURE: SCANNED', 'DNA SEQUENCE: PROCESSING', 'ALERT: UNKNOWN ORGANISM'],
      ['NAVIGATION: ONLINE', 'STELLAR POSITION: LOCKED', 'TRAJECTORY: CALCULATED', 'CAUTION: GRAVITATIONAL WAVE'],
      ['POWER LEVELS: NOMINAL', 'REACTOR TEMP: STABLE', 'ENERGY OUTPUT: OPTIMAL', 'NOTICE: MAINTENANCE DUE'],
      ['SECURITY STATUS: GREEN', 'PERIMETER: SECURED', 'ACCESS LOGS: VERIFIED', 'WARNING: BREACH DETECTED'],
      ['MEDICAL SCAN: COMPLETE', 'VITAL SIGNS: NORMAL', 'BRAIN ACTIVITY: STABLE', 'ALERT: ANOMALY FOUND'],
      ['COMMUNICATIONS: ACTIVE', 'SIGNAL STRENGTH: STRONG', 'DATA TRANSMISSION: OK', 'ERROR: INTERFERENCE'],
      ['MINING OPERATIONS: BUSY', 'EXTRACTION RATE: HIGH', 'RESOURCE YIELD: GOOD', 'CAUTION: INSTABILITY']
    ]
  }));
  
  // Initialize stable labels once
  useState(() => {
    Object.keys(stableData.selectedLabels).forEach(key => {
      const category = stableData.dataLabels[key as keyof typeof stableData.dataLabels];
      stableData.selectedLabels[key as keyof typeof stableData.selectedLabels] = category[Math.floor(Math.random() * category.length)];
    });
  });

  // Initialize particles
  useEffect(() => {
    if (!uiData.hasParticles) return;
    
    const initialParticles: Particle[] = Array.from({ length: uiData.particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 300 + 50, // Center particles in a smaller area
      y: Math.random() * 200 + 50,
      size: Math.random() * 3 + 1,
      color: [uiData.colors.primary, uiData.colors.secondary, uiData.colors.accent][Math.floor(Math.random() * 3)],
      speed: Math.random() * 0.5 + 0.2,
      direction: Math.random() * Math.PI * 2
    }));
    setParticles(initialParticles);
  }, [uiData]);

  // Animate particles
  useEffect(() => {
    if (!uiData.hasParticles) return;
    
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + Math.cos(particle.direction) * particle.speed + 350) % 350,
        y: (particle.y + Math.sin(particle.direction) * particle.speed + 250) % 250,
        direction: particle.direction + (Math.random() - 0.5) * 0.1
      })));
    }, 50);

    return () => clearInterval(interval);
  }, [uiData.hasParticles]);

  // Animate data
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationData(prev => ({
        vitalityLevel: (prev.vitalityLevel + 1) % 100,
        dataPoints: Array.from({ length: 30 }, () => Math.random() * 40 + 10),
        radarSweep: (prev.radarSweep + 2) % 360,
      }));
    }, 100 / uiData.animationSpeed);

    return () => clearInterval(interval);
  }, [uiData.animationSpeed]);

  const getStableLabel = (label: string) => {
    return stableData.selectedLabels[label as keyof typeof stableData.selectedLabels] || 'DATA PROCESSING';
  };

  const renderBarChart = () => {
    if (!uiData.hasBarChart) return null;
    
    const bars = Array.from({ length: 8 }, (_, i) => {
      const height = Math.sin(Date.now() * 0.003 + i) * 20 + 30;
      const isActive = i < Math.floor(animationData.vitalityLevel / 12.5);
      
      return (
        <motion.div
          key={i}
          className="w-4 border"
          style={{ 
            height: `${height}px`,
            borderColor: uiData.colors.secondary,
            backgroundColor: isActive ? uiData.colors.primary : 'transparent'
          }}
          animate={{ opacity: isActive ? [0.7, 1, 0.7] : 0.3 }}
          transition={{ duration: uiData.animationSpeed, repeat: Infinity }}
        />
      );
    });

    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          {getStableLabel('BAR')}
        </div>
        <div className="flex items-end gap-1 h-16">
          {bars}
        </div>
      </div>
    );
  };

  const renderLineGraph = () => {
    if (!uiData.hasLineGraph) return null;
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          {getStableLabel('LINE')}
        </div>
        <div className="h-12 relative">
          <svg width="150" height="48" className="absolute">
            <motion.polyline
              points={animationData.dataPoints.map((val, i) => `${i * 5},${48 - val * 0.8}`).join(' ')}
              fill="none"
              stroke={uiData.colors.primary}
              strokeWidth="1"
              animate={{ strokeDasharray: ['0 1000', '1000 0'] }}
              transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity }}
            />
          </svg>
        </div>
      </div>
    );
  };

  const renderRadar = () => {
    if (!uiData.hasRadar) return null;
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          RADAR SWEEP
        </div>
        <div className="relative w-20 h-20">
          <svg width="80" height="80" className="absolute">
            <circle cx="40" cy="40" r="15" fill="none" stroke={uiData.colors.primary} strokeWidth="1" />
            <circle cx="40" cy="40" r="30" fill="none" stroke={uiData.colors.primary} strokeWidth="1" />
            <circle cx="40" cy="40" r="35" fill="none" stroke={uiData.colors.primary} strokeWidth="1" />
            <line x1="40" y1="5" x2="40" y2="75" stroke={uiData.colors.primary} strokeWidth="1" />
            <line x1="5" y1="40" x2="75" y2="40" stroke={uiData.colors.primary} strokeWidth="1" />
            
            <motion.line
              x1="40" y1="40"
              x2="40" y2="5"
              stroke={uiData.colors.warning}
              strokeWidth="2"
              animate={{ rotate: animationData.radarSweep }}
              transition={{ duration: 0, ease: 'linear' }}
              style={{ transformOrigin: '40px 40px' }}
            />
            
            {/* Blips */}
            <motion.circle
              cx="25" cy="25" r="2"
              fill={uiData.colors.accent}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            <motion.circle
              cx="55" cy="30" r="1"
              fill={uiData.colors.secondary}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
            />
          </svg>
        </div>
      </div>
    );
  };

  const renderHeatMap = () => {
    if (!uiData.hasHeatMap) return null;
    
    const grid = Array.from({ length: 64 }, (_, i) => {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const intensity = Math.sin((row + col) * 0.8 + Date.now() * 0.002) * 0.5 + 0.5;
      
      return (
        <motion.div
          key={i}
          className="w-2 h-2 border-[0.5px]"
          style={{ 
            borderColor: uiData.colors.primary,
            backgroundColor: `rgba(${parseInt(uiData.colors.primary.slice(1, 3), 16)}, ${parseInt(uiData.colors.primary.slice(3, 5), 16)}, ${parseInt(uiData.colors.primary.slice(5, 7), 16)}, ${intensity})`
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.02 }}
        />
      );
    });

    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          {getStableLabel('HEAT')}
        </div>
        <div className="grid grid-cols-8 gap-[1px] w-fit">
          {grid}
        </div>
      </div>
    );
  };

  const renderWaveform = () => {
    if (!uiData.hasWaveform) return null;
    
    const [waveformId] = useState(`waveform-${Math.random().toString(36).substr(2, 9)}`);
    
    const wavePoints = Array.from({ length: 50 }, (_, i) => {
      const x = i * 3;
      const y = Math.sin(i * 0.3 + Date.now() * 0.005) * 15 + 25;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          {getStableLabel('WAVE')}
        </div>
        <div className="h-12 relative">
          <svg width="150" height="48" className="absolute">
            <motion.polyline
              points={wavePoints}
              fill="none"
              stroke={uiData.colors.accent}
              strokeWidth="1"
              animate={{ 
                strokeDasharray: ['5 5', '10 5', '5 5'],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: uiData.animationSpeed, repeat: Infinity }}
            />
            <defs>
              <linearGradient id={`waveGlow-${waveformId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: uiData.colors.accent, stopOpacity: 0 }} />
                <stop offset="50%" style={{ stopColor: uiData.colors.accent, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: uiData.colors.accent, stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <motion.polyline
              points={wavePoints}
              fill="none"
              stroke={`url(#waveGlow-${waveformId})`}
              strokeWidth="3"
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: uiData.animationSpeed * 1.5, repeat: Infinity }}
            />
          </svg>
        </div>
      </div>
    );
  };

  const renderSpectrum = () => {
    if (!uiData.hasSpectrum) return null;
    
    const bars = Array.from({ length: 20 }, (_, i) => {
      const height = Math.abs(Math.sin(i * 0.5 + Date.now() * 0.004)) * 30 + 5;
      
      return (
        <motion.rect
          key={i}
          x={i * 6}
          y={40 - height}
          width="4"
          height={height}
          fill={uiData.colors.primary}
          animate={{ 
            height: [height * 0.5, height, height * 0.5],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.05 }}
        />
      );
    });
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          {getStableLabel('SPEC')}
        </div>
        <div className="h-10">
          <svg width="120" height="40">
            {bars}
          </svg>
        </div>
      </div>
    );
  };

  const renderStatusGrid = () => {
    if (!uiData.hasStatusGrid) return null;
    
    // Generate stable status for each grid item
    const [gridStatuses] = useState(() => 
      Array.from({ length: 16 }, (_, i) => {
        const status = ['OK', 'ERR', 'WARN', 'OFF'][i % 4];
        return { status, id: i };
      })
    );
    
    const gridItems = gridStatuses.map(({ status, id }, i) => {
      const isActive = Math.sin(id + Date.now() * 0.003) > 0;
      const statusColor = {
        'OK': uiData.colors.primary,
        'ERR': uiData.colors.warning,
        'WARN': uiData.colors.accent,
        'OFF': '#666666'
      }[status];
      
      return (
        <motion.div
          key={id}
          className="w-6 h-4 border flex items-center justify-center text-xs"
          style={{ 
            borderColor: uiData.colors.secondary,
            color: statusColor,
            backgroundColor: isActive ? `${statusColor}20` : 'transparent'
          }}
          animate={{ 
            opacity: isActive ? [0.7, 1, 0.7] : 0.4,
            scale: isActive ? [0.95, 1, 0.95] : 1
          }}
          transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity, delay: i * 0.1 }}
        >
          {id + 1}
        </motion.div>
      );
    });
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          {getStableLabel('GRID')}
        </div>
        <div className="grid grid-cols-4 gap-1 w-fit">
          {gridItems}
        </div>
      </div>
    );
  };

  const renderProgressRings = () => {
    if (!uiData.hasProgressRings) return null;
    
    const rings = Array.from({ length: 3 }, (_, i) => {
      const progress = (Math.sin(Date.now() * 0.002 + i) + 1) * 50;
      const radius = 25 - i * 5;
      const circumference = 2 * Math.PI * radius;
      const strokeDasharray = circumference;
      const strokeDashoffset = circumference - (progress / 100) * circumference;
      
      return (
        <motion.circle
          key={i}
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke={[uiData.colors.primary, uiData.colors.secondary, uiData.colors.accent][i]}
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 30 30)"
          animate={{ 
            strokeDashoffset: [strokeDashoffset, strokeDashoffset - 50, strokeDashoffset],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ duration: uiData.animationSpeed * 3, repeat: Infinity, delay: i * 0.5 }}
        />
      );
    });
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          {getStableLabel('RING')}
        </div>
        <div className="relative">
          <svg width="60" height="60">
            {rings}
            <text x="30" y="35" textAnchor="middle" fill={uiData.colors.primary} fontSize="10" className="font-mono">
              {Math.floor(Date.now() * 0.01) % 100}%
            </text>
          </svg>
        </div>
      </div>
    );
  };

  const renderDNAHelix = () => {
    if (!uiData.hasDNAHelix) return null;
    
    const helixPoints = Array.from({ length: 30 }, (_, i) => {
      const angle = i * 0.3;
      const x1 = Math.cos(angle + Date.now() * 0.003) * 20 + 75;
      const y1 = i * 3 + 10;
      const x2 = Math.cos(angle + Math.PI + Date.now() * 0.003) * 20 + 75;
      const y2 = i * 3 + 10;
      return { x1, y1, x2, y2, i };
    });
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          DNA HELIX SCAN
        </div>
        <div className="h-24 relative">
          <svg width="150" height="90" className="absolute">
            {helixPoints.map(({ x1, y1, x2, y2, i }) => (
              <motion.g key={i}>
                <motion.circle
                  cx={x1} cy={y1} r="2"
                  fill={uiData.colors.primary}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.1 }}
                />
                <motion.circle
                  cx={x2} cy={y2} r="2"
                  fill={uiData.colors.secondary}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.1 + 0.5 }}
                />
                {i % 5 === 0 && (
                  <motion.line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={uiData.colors.accent}
                    strokeWidth="1"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity, delay: i * 0.05 }}
                  />
                )}
              </motion.g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderOscilloscope = () => {
    if (!uiData.hasOscilloscope) return null;
    
    const oscilloscopeData = Array.from({ length: 60 }, (_, i) => {
      const t = i * 0.1;
      const wave1 = Math.sin(t * 2 + Date.now() * 0.005) * 15;
      const wave2 = Math.sin(t * 3 + Date.now() * 0.003) * 10;
      return { x: i * 2.5, y: 45 + wave1 + wave2 };
    });
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          OSCILLOSCOPE
        </div>
        <div className="h-20 relative">
          <svg width="150" height="80" className="absolute">
            {/* Grid lines */}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={i} x1="0" y1={i * 16} x2="150" y2={i * 16} stroke={uiData.colors.primary} strokeWidth="0.5" opacity="0.3" />
            ))}
            {Array.from({ length: 11 }, (_, i) => (
              <line key={i} x1={i * 15} y1="0" x2={i * 15} y2="80" stroke={uiData.colors.primary} strokeWidth="0.5" opacity="0.3" />
            ))}
            
            <motion.polyline
              points={oscilloscopeData.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={uiData.colors.warning}
              strokeWidth="2"
              animate={{ strokeDasharray: ['0 500', '500 0'] }}
              transition={{ duration: uiData.animationSpeed * 3, repeat: Infinity }}
            />
          </svg>
        </div>
      </div>
    );
  };

  const renderWireframe3D = () => {
    if (!uiData.hasWireframe3D) return null;
    
    const rotationY = Date.now() * 0.001;
    const vertices = [
      [-20, -20, -20], [20, -20, -20], [20, 20, -20], [-20, 20, -20],
      [-20, -20, 20], [20, -20, 20], [20, 20, 20], [-20, 20, 20]
    ];
    
    const project = ([x, y, z]: number[]) => {
      const rotatedX = x * Math.cos(rotationY) - z * Math.sin(rotationY);
      const rotatedZ = x * Math.sin(rotationY) + z * Math.cos(rotationY);
      const scale = 200 / (200 + rotatedZ);
      return {
        x: rotatedX * scale + 75,
        y: y * scale + 40
      };
    };
    
    const projectedVertices = vertices.map(project);
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          3D WIREFRAME
        </div>
        <div className="h-20 relative">
          <svg width="150" height="80" className="absolute">
            {/* Cube edges */}
            {[
              [0,1], [1,2], [2,3], [3,0], // back face
              [4,5], [5,6], [6,7], [7,4], // front face
              [0,4], [1,5], [2,6], [3,7]  // connecting edges
            ].map(([a, b], i) => (
              <motion.line
                key={i}
                x1={projectedVertices[a].x} y1={projectedVertices[a].y}
                x2={projectedVertices[b].x} y2={projectedVertices[b].y}
                stroke={uiData.colors.primary}
                strokeWidth="1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
            
            {/* Vertices */}
            {projectedVertices.map((vertex, i) => (
              <motion.circle
                key={i}
                cx={vertex.x} cy={vertex.y} r="2"
                fill={uiData.colors.accent}
                animate={{ r: [1, 3, 1] }}
                transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderNetworkTopology = () => {
    if (!uiData.hasNetworkTopology) return null;
    
    const nodes = Array.from({ length: 8 }, (_, i) => ({
      x: 30 + (i % 3) * 45,
      y: 25 + Math.floor(i / 3) * 30,
      id: i,
      active: Math.sin(i + Date.now() * 0.002) > 0
    }));
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          NETWORK TOPOLOGY
        </div>
        <div className="h-20 relative">
          <svg width="150" height="80" className="absolute">
            {/* Connections */}
            {nodes.map((node, i) => 
              nodes.slice(i + 1).map((otherNode, j) => {
                const distance = Math.sqrt((node.x - otherNode.x)**2 + (node.y - otherNode.y)**2);
                if (distance < 60) {
                  return (
                    <motion.line
                      key={`${i}-${j}`}
                      x1={node.x} y1={node.y}
                      x2={otherNode.x} y2={otherNode.y}
                      stroke={uiData.colors.primary}
                      strokeWidth="1"
                      animate={{ 
                        opacity: [0.2, 0.8, 0.2],
                        strokeDasharray: ['0 100', '100 0']
                      }}
                      transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity, delay: (i + j) * 0.1 }}
                    />
                  );
                }
                return null;
              })
            )}
            
            {/* Nodes */}
            {nodes.map((node) => (
              <motion.circle
                key={node.id}
                cx={node.x} cy={node.y} r="4"
                fill={node.active ? uiData.colors.warning : uiData.colors.secondary}
                stroke={uiData.colors.primary}
                strokeWidth="1"
                animate={{ 
                  r: node.active ? [4, 7, 4] : [3, 4, 3],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: node.id * 0.1 }}
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderSignalAnalysis = () => {
    if (!uiData.hasSignalAnalysis) return null;
    
    const signals = Array.from({ length: 5 }, (_, i) => ({
      frequency: 1 + i * 0.5,
      amplitude: 10 + i * 3,
      phase: i * Math.PI / 3
    }));
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          SIGNAL ANALYSIS
        </div>
        <div className="h-16 relative">
          <svg width="150" height="64" className="absolute">
            {signals.map((signal, i) => {
              const points = Array.from({ length: 50 }, (_, j) => {
                const x = j * 3;
                const y = 32 + Math.sin(j * 0.1 * signal.frequency + Date.now() * 0.003 + signal.phase) * signal.amplitude;
                return `${x},${y}`;
              }).join(' ');
              
              return (
                <motion.polyline
                  key={i}
                  points={points}
                  fill="none"
                  stroke={[uiData.colors.primary, uiData.colors.secondary, uiData.colors.accent, uiData.colors.warning, '#888888'][i]}
                  strokeWidth="1"
                  opacity="0.8"
                  animate={{ strokeDasharray: ['0 300', '300 0'] }}
                  transition={{ duration: uiData.animationSpeed * (2 + i), repeat: Infinity }}
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const renderFrequencyBands = () => {
    if (!uiData.hasFrequencyBands) return null;
    
    const bands = Array.from({ length: 12 }, (_, i) => {
      const height = Math.abs(Math.sin(i * 0.5 + Date.now() * 0.004)) * 40 + 5;
      return { height, active: height > 25 };
    });
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          FREQUENCY BANDS
        </div>
        <div className="h-12 flex items-end gap-1">
          {bands.map((band, i) => (
            <motion.div
              key={i}
              className="w-3 border-b border-l border-r"
              style={{
                height: `${band.height}px`,
                borderColor: uiData.colors.primary,
                backgroundColor: band.active ? uiData.colors.primary : 'transparent'
              }}
              animate={{ 
                opacity: band.active ? [0.7, 1, 0.7] : 0.4,
                backgroundColor: band.active ? 
                  [uiData.colors.primary, uiData.colors.accent, uiData.colors.primary] : 
                  'transparent'
              }}
              transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.05 }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderDataStreams = () => {
    if (!uiData.hasDataStreams) return null;
    
    const streams = Array.from({ length: 6 }, (_, i) => ({
      offset: i * 25,
      speed: 1 + i * 0.3,
      color: [uiData.colors.primary, uiData.colors.secondary, uiData.colors.accent][i % 3]
    }));
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          DATA STREAMS
        </div>
        <div className="h-16 relative overflow-hidden">
          <svg width="150" height="64" className="absolute">
            {streams.map((stream, i) => (
              <motion.g key={i}>
                {Array.from({ length: 8 }, (_, j) => (
                  <motion.circle
                    key={j}
                    cx="0" cy={stream.offset + 8}
                    r="2"
                    fill={stream.color}
                    animate={{ 
                      cx: [0, 150],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{ 
                      duration: uiData.animationSpeed * 3 / stream.speed,
                      repeat: Infinity,
                      delay: j * 0.3
                    }}
                  />
                ))}
              </motion.g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderMatrixRain = () => {
    if (!uiData.hasMatrixRain) return null;
    
    const columns = Array.from({ length: 15 }, (_, i) => ({
      x: i * 10,
      drops: Array.from({ length: 8 }, (_, j) => ({
        y: j * 10,
        char: String.fromCharCode(33 + Math.floor(Math.random() * 94)),
        active: Math.random() > 0.7
      }))
    }));
    
    return (
      <div className="p-3 text-left">
        <div className="text-sm mb-2 text-left" style={{ color: uiData.colors.secondary }}>
          MATRIX RAIN
        </div>
        <div className="h-20 relative overflow-hidden">
          <svg width="150" height="80" className="absolute font-mono">
            {columns.map((column, i) => (
              <motion.g key={i}>
                {column.drops.map((drop, j) => (
                  <motion.text
                    key={j}
                    x={column.x} y={drop.y}
                    fill={drop.active ? uiData.colors.primary : uiData.colors.secondary}
                    fontSize="8"
                    fontFamily="monospace"
                    animate={{ 
                      y: [drop.y, drop.y + 80],
                      opacity: drop.active ? [1, 0.5, 0] : [0.3, 0.1, 0]
                    }}
                    transition={{ 
                      duration: uiData.animationSpeed * 2,
                      repeat: Infinity,
                      delay: (i + j) * 0.1
                    }}
                  >
                    {drop.char}
                  </motion.text>
                ))}
              </motion.g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  const renderCenterDisplay = () => {
    const centerElements = [
      // Original flower
      () => (
        <svg width="100" height="100" className="pixelated">
          <g transform="translate(50,50)">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.g 
                key={i}
                transform={`rotate(${i * 60})`}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.1 }}
              >
                <rect x="-2" y="-30" width="4" height="25" fill={uiData.colors.primary} />
                <rect x="-3" y="-25" width="6" height="15" fill={uiData.colors.secondary} />
              </motion.g>
            ))}
            <motion.circle 
              cx="0" cy="0" r="6" 
              fill={uiData.colors.accent}
              animate={{ r: [6, 10, 6] }}
              transition={{ duration: uiData.animationSpeed, repeat: Infinity }}
            />
          </g>
        </svg>
      ),
      // Hexagon grid
      () => (
        <svg width="120" height="120">
          <g transform="translate(60,60)">
            {Array.from({ length: 19 }, (_, i) => {
              const rings = [0, 6, 12];
              const ringIndex = rings.findIndex(r => i < r + (rings[rings.indexOf(r) + 1] || 19));
              const posInRing = i - (rings[ringIndex] || 0);
              const angle = (posInRing * 60) * Math.PI / 180;
              const radius = ringIndex * 15;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.polygon
                  key={i}
                  points="0,-8 7,-4 7,4 0,8 -7,4 -7,-4"
                  fill="none"
                  stroke={uiData.colors.primary}
                  strokeWidth="1"
                  transform={`translate(${x},${y})`}
                  animate={{ 
                    fill: [uiData.colors.primary + '00', uiData.colors.primary + '60', uiData.colors.primary + '00'],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity, delay: i * 0.1 }}
                />
              );
            })}
          </g>
        </svg>
      ),
      // Spinning radar
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            <circle cx="0" cy="0" r="35" fill="none" stroke={uiData.colors.primary} strokeWidth="1" />
            <circle cx="0" cy="0" r="25" fill="none" stroke={uiData.colors.primary} strokeWidth="1" />
            <circle cx="0" cy="0" r="15" fill="none" stroke={uiData.colors.primary} strokeWidth="1" />
            <motion.line
              x1="0" y1="0" x2="0" y2="-35"
              stroke={uiData.colors.warning}
              strokeWidth="2"
              animate={{ rotate: 360 }}
              transition={{ duration: uiData.animationSpeed, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: '0 0' }}
            />
            <motion.circle
              cx="15" cy="-10" r="2"
              fill={uiData.colors.accent}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </g>
        </svg>
      ),
      // Crystal formation
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            {Array.from({ length: 4 }, (_, i) => (
              <motion.g 
                key={i}
                transform={`rotate(${i * 90})`}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.2 }}
              >
                <polygon
                  points="0,-25 8,-8 0,0 -8,-8"
                  fill={uiData.colors.primary}
                  stroke={uiData.colors.secondary}
                  strokeWidth="1"
                />
              </motion.g>
            ))}
            <motion.rect
              x="-5" y="-5" width="10" height="10"
              fill={uiData.colors.accent}
              animate={{ rotate: 45, scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: uiData.animationSpeed, repeat: Infinity }}
              style={{ transformOrigin: '0 0' }}
            />
          </g>
        </svg>
      ),
      // Data matrix
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            {Array.from({ length: 64 }, (_, i) => {
              const row = Math.floor(i / 8) - 4;
              const col = (i % 8) - 4;
              const x = col * 8;
              const y = row * 8;
              const active = Math.sin(i + Date.now() * 0.005) > 0.5;
              
              return (
                <motion.rect
                  key={i}
                  x={x - 1} y={y - 1} width="2" height="2"
                  fill={active ? uiData.colors.primary : uiData.colors.secondary}
                  animate={{ 
                    opacity: active ? [0.3, 1, 0.3] : 0.2,
                    scale: active ? [0.5, 1, 0.5] : 0.5
                  }}
                  transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.02 }}
                />
              );
            })}
          </g>
        </svg>
      ),
      // Orbital system
      () => (
        <svg width="120" height="120">
          <g transform="translate(60,60)">
            <circle cx="0" cy="0" r="6" fill={uiData.colors.accent} />
            {Array.from({ length: 3 }, (_, i) => {
              const radius = 15 + i * 10;
              return (
                <g key={i}>
                  <circle cx="0" cy="0" r={radius} fill="none" stroke={uiData.colors.primary} strokeWidth="1" opacity="0.3" />
                  <motion.circle
                    cx={radius} cy="0" r="3"
                    fill={[uiData.colors.primary, uiData.colors.secondary, uiData.colors.warning][i]}
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: uiData.animationSpeed * (2 + i), 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    style={{ transformOrigin: `-${radius}px 0` }}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      ),
      // Waveform display
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            <motion.path
              d={Array.from({ length: 50 }, (_, i) => {
                const x = (i - 25) * 2;
                const y = Math.sin(i * 0.3 + Date.now() * 0.005) * 20;
                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke={uiData.colors.primary}
              strokeWidth="2"
              animate={{ 
                strokeDasharray: ['0 200', '200 0'],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity }}
            />
            <circle cx="0" cy="0" r="25" fill="none" stroke={uiData.colors.secondary} strokeWidth="1" opacity="0.3" />
          </g>
        </svg>
      ),
      // Geometric mandala
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            {Array.from({ length: 8 }, (_, i) => (
              <motion.g 
                key={i}
                transform={`rotate(${i * 45})`}
                animate={{ 
                  scale: [0.8, 1.1, 0.8],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.1 }}
              >
                <polygon
                  points="0,-30 5,-15 0,-5 -5,-15"
                  fill={i % 2 ? uiData.colors.primary : uiData.colors.secondary}
                  stroke={uiData.colors.accent}
                  strokeWidth="0.5"
                />
              </motion.g>
            ))}
          </g>
        </svg>
      ),
      // Quantum field
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            {Array.from({ length: 50 }, (_, i) => {
              const angle = i * 0.5;
              const radius = Math.sin(i * 0.2 + Date.now() * 0.003) * 20 + 25;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.circle
                  key={i}
                  cx={x} cy={y} r="1"
                  fill={uiData.colors.primary}
                  animate={{ 
                    opacity: [0.2, 1, 0.2],
                    r: [0.5, 2, 0.5]
                  }}
                  transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.02 }}
                />
              );
            })}
          </g>
        </svg>
      ),
      // Neural network
      () => (
        <svg width="120" height="120">
          <g transform="translate(60,60)">
            {Array.from({ length: 12 }, (_, i) => {
              const layer = Math.floor(i / 4);
              const nodeInLayer = i % 4;
              const x = (layer - 1) * 30;
              const y = (nodeInLayer - 1.5) * 15;
              
              return (
                <g key={i}>
                  <motion.circle
                    cx={x} cy={y} r="4"
                    fill={uiData.colors.secondary}
                    stroke={uiData.colors.primary}
                    strokeWidth="1"
                    animate={{ 
                      fill: [uiData.colors.secondary, uiData.colors.accent, uiData.colors.secondary],
                      r: [3, 5, 3]
                    }}
                    transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity, delay: i * 0.1 }}
                  />
                  {/* Connections */}
                  {layer < 2 && Array.from({ length: 4 }, (_, j) => {
                    const nextX = x + 30;
                    const nextY = (j - 1.5) * 15;
                    return (
                      <motion.line
                        key={j}
                        x1={x + 4} y1={y}
                        x2={nextX - 4} y2={nextY}
                        stroke={uiData.colors.primary}
                        strokeWidth="1"
                        animate={{ 
                          opacity: [0.3, 0.8, 0.3],
                          strokeWidth: [0.5, 2, 0.5]
                        }}
                        transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: (i + j) * 0.05 }}
                      />
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>
      ),
      // Energy pulse
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            {Array.from({ length: 4 }, (_, i) => (
              <motion.circle
                key={i}
                cx="0" cy="0"
                r={10 + i * 8}
                fill="none"
                stroke={uiData.colors.primary}
                strokeWidth="1"
                animate={{ 
                  r: [10 + i * 8, 35 + i * 8],
                  opacity: [1, 0]
                }}
                transition={{ 
                  duration: uiData.animationSpeed * 2,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              />
            ))}
            <motion.circle
              cx="0" cy="0" r="8"
              fill={uiData.colors.accent}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: uiData.animationSpeed, repeat: Infinity }}
            />
          </g>
        </svg>
      ),
      // Crystal lattice
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            {Array.from({ length: 25 }, (_, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              const x = (col - 2) * 15;
              const y = (row - 2) * 15;
              const active = (row + col) % 2 === Math.floor(Date.now() * 0.002) % 2;
              
              return (
                <motion.g key={i}>
                  <motion.rect
                    x={x - 3} y={y - 3} width="6" height="6"
                    fill={active ? uiData.colors.primary : 'none'}
                    stroke={uiData.colors.secondary}
                    strokeWidth="1"
                    animate={{ 
                      scale: active ? [0.8, 1.2, 0.8] : [0.6, 0.8, 0.6],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: uiData.animationSpeed, repeat: Infinity, delay: i * 0.05 }}
                  />
                  {/* Connection lines */}
                  {col < 4 && (
                    <motion.line
                      x1={x + 3} y1={y} x2={x + 12} y2={y}
                      stroke={uiData.colors.primary}
                      strokeWidth="0.5"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity, delay: i * 0.02 }}
                    />
                  )}
                  {row < 4 && (
                    <motion.line
                      x1={x} y1={y + 3} x2={x} y2={y + 12}
                      stroke={uiData.colors.primary}
                      strokeWidth="0.5"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity, delay: i * 0.02 }}
                    />
                  )}
                </motion.g>
              );
            })}
          </g>
        </svg>
      ),
      // Time dilation field
      () => (
        <svg width="100" height="100">
          <g transform="translate(50,50)">
            {Array.from({ length: 6 }, (_, i) => {
              const angle = i * 60;
              const radius = 25;
              const x = Math.cos(angle * Math.PI / 180) * radius;
              const y = Math.sin(angle * Math.PI / 180) * radius;
              
              return (
                <motion.g key={i}>
                  <motion.circle
                    cx={x} cy={y} r="3"
                    fill={uiData.colors.accent}
                    animate={{ 
                      scale: [1, 2, 1],
                      opacity: [1, 0.3, 1]
                    }}
                    transition={{ 
                      duration: uiData.animationSpeed * 3,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                  <motion.line
                    x1="0" y1="0" x2={x} y2={y}
                    stroke={uiData.colors.primary}
                    strokeWidth="1"
                    animate={{ 
                      strokeDasharray: ['0 100', '100 0'],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity, delay: i * 0.1 }}
                  />
                </motion.g>
              );
            })}
            <motion.circle
              cx="0" cy="0" r="5"
              fill={uiData.colors.warning}
              animate={{ 
                r: [5, 8, 5],
                opacity: [0.8, 0.4, 0.8]
              }}
              transition={{ duration: uiData.animationSpeed, repeat: Infinity }}
            />
          </g>
        </svg>
      )
    ];
    
    const centerElement = uiData.centerElement || 0;
    const statusSet = stableData.statusMessages[centerElement % stableData.statusMessages.length] || stableData.statusMessages[0];
    
    return (
      <div className="relative w-full h-64 flex items-center justify-center overflow-hidden">
        {/* Particles Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {uiData.hasParticles && particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                left: `${(particle.x / 350) * 100}%`,
                top: `${(particle.y / 250) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
              animate={{ 
                opacity: [0.3, 1, 0.3],
                scale: [0.5, 1, 0.5]
              }}
              transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
            />
          ))}
        </div>

        {/* Central Element */}
        <motion.div 
          className="relative z-10 flex items-center justify-center"
          animate={{ 
            scale: [1, 1.05, 1],
            filter: ['hue-rotate(0deg)', 'hue-rotate(30deg)', 'hue-rotate(0deg)']
          }}
          transition={{ duration: uiData.animationSpeed * 2, repeat: Infinity }}
        >
          {centerElements[centerElement % centerElements.length]()}
        </motion.div>

        {/* Technical readout */}
        <div className="absolute bottom-0 left-0 text-xs space-y-1 font-mono max-w-xs p-2 text-left">
          <motion.div 
            className="text-left"
            style={{ color: uiData.colors.secondary }}
            animate={{ opacity: [0.6, 1, 0.6] }} 
            transition={{ duration: 2, repeat: Infinity }}
          >
            {statusSet[0]}
          </motion.div>
          <div className="text-left" style={{ color: uiData.colors.primary }}>{statusSet[1]}</div>
          <div className="text-left" style={{ color: uiData.colors.secondary }}>{statusSet[2]}</div>
          <motion.div 
            className="text-left"
            style={{ color: uiData.colors.warning }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {statusSet[3]}
          </motion.div>
        </div>
      </div>
    );
  };

  // Generate stable panel selection
  const [selectedPanels] = useState(() => {
    const panelComponents = [
      renderBarChart, renderLineGraph, renderRadar, renderHeatMap, 
      renderWaveform, renderSpectrum, renderStatusGrid, renderProgressRings,
      renderDNAHelix, renderOscilloscope, renderWireframe3D, renderNetworkTopology,
      renderSignalAnalysis, renderFrequencyBands, renderDataStreams, renderMatrixRain
    ];
    
    const availablePanels = [...panelComponents];
    const selected = [];
    for (let i = 0; i < Math.min(uiData.panels, panelComponents.length); i++) {
      const randomIndex = Math.floor(Math.random() * availablePanels.length);
      const selectedPanel = availablePanels.splice(randomIndex, 1)[0];
      selected.push({ id: i, component: selectedPanel });
    }
    return selected;
  });
  
  const panels = selectedPanels.map(({ component }) => component());

  const renderLayout = () => {
    const layout = uiData.layout || 'classic_split';
    const validPanels = panels.filter(Boolean);
    
    const layouts = {
      classic_split: () => (
        <div className="flex h-[calc(100%-60px)] overflow-hidden">
          <div className="w-1/2 border-r-2 p-4 relative overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
            <div className="text-sm mb-4 tracking-wider text-left" style={{ color: uiData.colors.secondary }}>MAIN DISPLAY</div>
            {renderCenterDisplay()}
          </div>
          <div className="w-1/2 flex flex-col overflow-hidden">
            {validPanels.map((panel, index) => (
              <div key={`classic-panel-${index}`} className="flex-1 border-b-2 last:border-b-0 overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
                {panel}
              </div>
            ))}
          </div>
        </div>
      ),
      
      quad_grid: () => (
        <div className="grid grid-cols-2 h-[calc(100%-60px)] overflow-hidden">
          <div className="border-r-2 border-b-2 p-4 relative overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
            <div className="text-sm mb-2 tracking-wider text-left" style={{ color: uiData.colors.secondary }}>MAIN DISPLAY</div>
            {renderCenterDisplay()}
          </div>
          {validPanels.slice(0, 3).map((panel, index) => (
            <div key={`quad-panel-${index}`} className={`p-4 overflow-hidden ${index === 0 ? 'border-b-2' : index === 1 ? 'border-l-2 border-b-2' : 'border-l-2'}`} 
              style={{ borderColor: uiData.colors.primary }}>
              {panel}
            </div>
          ))}
        </div>
      ),
      
      vertical_stack: () => (
        <div className="flex flex-col h-[calc(100%-60px)] overflow-hidden">
          <div className="h-1/3 border-b-2 p-4 relative overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
            <div className="text-sm mb-2 tracking-wider text-left" style={{ color: uiData.colors.secondary }}>MAIN DISPLAY</div>
            {renderCenterDisplay()}
          </div>
          <div className="flex-1 grid grid-cols-2 overflow-hidden">
            {validPanels.slice(0, 4).map((panel, index) => (
              <div key={`vertical-panel-${index}`} className={`border-r-2 border-b-2 last:border-r-0 overflow-hidden ${Math.floor(index / 2) === 1 ? 'border-b-0' : ''}`} 
                style={{ borderColor: uiData.colors.primary }}>
                {panel}
              </div>
            ))}
          </div>
        </div>
      ),
      
      horizontal_strip: () => (
        <div className="flex h-[calc(100%-60px)] overflow-hidden">
          <div className="w-1/3 border-r-2 p-4 relative overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
            <div className="text-sm mb-2 tracking-wider text-left" style={{ color: uiData.colors.secondary }}>MAIN</div>
            {renderCenterDisplay()}
          </div>
          {validPanels.slice(0, 5).map((panel, index) => (
            <div key={`horizontal-panel-${index}`} className="flex-1 border-r-2 last:border-r-0 overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
              {panel}
            </div>
          ))}
        </div>
      ),
      
      L_shape: () => (
        <div className="flex h-[calc(100%-60px)] overflow-hidden">
          <div className="w-2/3 flex flex-col overflow-hidden">
            <div className="h-2/3 border-r-2 border-b-2 p-4 relative overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
              <div className="text-sm mb-2 tracking-wider text-left" style={{ color: uiData.colors.secondary }}>MAIN DISPLAY</div>
              {renderCenterDisplay()}
            </div>
            <div className="flex-1 flex overflow-hidden">
              {validPanels.slice(0, 2).map((panel, index) => (
                <div key={`l-bottom-panel-${index}`} className="flex-1 border-r-2 last:border-r-0 overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
                  {panel}
                </div>
              ))}
            </div>
          </div>
          <div className="w-1/3 flex flex-col overflow-hidden">
            {validPanels.slice(2, 5).map((panel, index) => (
              <div key={`l-right-panel-${index}`} className="flex-1 border-b-2 last:border-b-0 overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
                {panel}
              </div>
            ))}
          </div>
        </div>
      ),
      
      center_focus: () => (
        <div className="relative h-[calc(100%-60px)] overflow-hidden">
          <div className="absolute inset-4 flex items-center justify-center">
            <div className="w-60 h-60 max-w-full max-h-full border-2 p-6 relative" style={{ borderColor: uiData.colors.primary }}>
              <div className="text-sm mb-4 tracking-wider text-center" style={{ color: uiData.colors.secondary }}>CENTRAL MATRIX</div>
              <div className="scale-75">{renderCenterDisplay()}</div>
            </div>
          </div>
          {validPanels.slice(0, 4).map((panel, index) => {
            const positions = [
              'top-4 left-4 w-40', 'top-4 right-4 w-40', 'bottom-4 left-4 w-40', 'bottom-4 right-4 w-40'
            ];
            return (
              <div key={`center-panel-${index}`} className={`absolute ${positions[index]} h-24 max-w-full max-h-full border-2`} style={{ borderColor: uiData.colors.primary }}>
                {panel}
              </div>
            );
          })}
        </div>
      ),
      
      corner_panels: () => (
        <div className="relative h-[calc(100%-60px)] overflow-hidden">
          <div className="absolute inset-12 border-2 p-6 flex items-center justify-center max-w-full max-h-full" style={{ borderColor: uiData.colors.primary }}>
            <div className="text-center">
              <div className="text-sm mb-4 tracking-wider" style={{ color: uiData.colors.secondary }}>CORE SYSTEM</div>
              <div className="scale-75">{renderCenterDisplay()}</div>
            </div>
          </div>
          {validPanels.slice(0, 4).map((panel, index) => {
            const positions = ['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'];
            return (
              <div key={`corner-panel-${index}`} className={`absolute ${positions[index]} w-32 h-20 max-w-full max-h-full border-2`} style={{ borderColor: uiData.colors.primary }}>
                {panel}
              </div>
            );
          })}
        </div>
      ),
      
      triple_column: () => (
        <div className="grid grid-cols-3 h-[calc(100%-60px)] overflow-hidden">
          <div className="border-r-2 p-4 relative overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
            <div className="text-sm mb-2 tracking-wider text-left" style={{ color: uiData.colors.secondary }}>PRIMARY</div>
            {renderCenterDisplay()}
          </div>
          <div className="border-r-2 flex flex-col w-full h-full max-w-full max-h-full overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
            {validPanels.slice(0, 3).map((panel, index) => (
              <div key={`triple-mid-panel-${index}`} className="flex-1 border-b-2 last:border-b-0 overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
                {panel}
              </div>
            ))}
          </div>
          <div className="flex flex-col overflow-hidden">
            {validPanels.slice(3, 6).map((panel, index) => (
              <div key={`triple-right-panel-${index}`} className="flex-1 border-b-2 last:border-b-0 overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
                {panel}
              </div>
            ))}
          </div>
        </div>
      ),
      
      asymmetric: () => (
        <div className="flex h-[calc(100%-60px)] overflow-hidden">
          <div className="w-3/5 flex flex-col overflow-hidden">
            <div className="h-3/5 border-r-2 border-b-2 p-4 relative overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
              <div className="text-sm mb-2 tracking-wider text-left" style={{ color: uiData.colors.secondary }}>MAIN SCOPE</div>
              {renderCenterDisplay()}
            </div>
            <div className="flex-1 grid grid-cols-3 border-r-2 overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
              {validPanels.slice(0, 3).map((panel, index) => (
                <div key={`asym-bottom-panel-${index}`} className="border-r-2 last:border-r-0 overflow-hidden" style={{ borderColor: uiData.colors.primary }}>
                  {panel}
                </div>
              ))}
            </div>
          </div>
          <div className="w-2/5 flex flex-col overflow-hidden">
            {validPanels.slice(3, 7).map((panel, index) => (
              <motion.div key={`asym-right-panel-${index}`} className="flex-1 border-b-2 last:border-b-0 overflow-hidden" style={{ borderColor: uiData.colors.primary }}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                {panel}
              </motion.div>
            ))}
          </div>
        </div>
      ),
      
      circular_hub: () => (
        <div className="relative h-[calc(100%-60px)] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 border-4 rounded-full p-6 flex items-center justify-center" style={{ borderColor: uiData.colors.primary }}>
              <div className="text-center">
                <div className="text-xs mb-2 tracking-wider" style={{ color: uiData.colors.secondary }}>HUB</div>
                <div className="scale-50">{renderCenterDisplay()}</div>
              </div>
            </div>
          </div>
          {validPanels.slice(0, 6).map((panel, index) => {
            const angle = (index * 60) * Math.PI / 180;
            const radius = 100;
            const containerWidth = 500;
            const containerHeight = 440;
            const panelWidth = 100;
            const panelHeight = 50;
            const x = Math.cos(angle) * radius + (containerWidth / 2) - (panelWidth / 2);
            const y = Math.sin(angle) * radius + (containerHeight / 2) - (panelHeight / 2);
            return (
              <div key={`circular-panel-${index}`} className="absolute border-2" 
                style={{ 
                  borderColor: uiData.colors.primary, 
                  left: Math.max(4, Math.min(x, containerWidth - panelWidth - 4)), 
                  top: Math.max(4, Math.min(y, containerHeight - panelHeight - 4)),
                  width: panelWidth,
                  height: panelHeight
                }}>
                {panel}
              </div>
            );
          })}
        </div>
      )
    };
    
    return layouts[layout as keyof typeof layouts]?.() || layouts.classic_split();
  };

  return (
    <div className="w-full h-full max-w-full max-h-full font-mono relative overflow-hidden" style={{ color: uiData.colors.primary }}>
      {/* Main container */}
      <div className="w-full h-full max-w-full max-h-full relative">
        
        {/* Header */}
        <motion.div 
          className="border-b-2 p-2"
          style={{ borderColor: uiData.colors.primary }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-lg tracking-wider">{uiData.title}</div>
          <motion.div 
            className="text-sm mt-1"
            style={{ color: uiData.colors.warning }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            SYSTEM ONLINE - DATA STREAMING
          </motion.div>
        </motion.div>

        {/* Dynamic Layout */}
        {renderLayout()}
      </div>

      {/* Enhanced Scanning Effects */}
      {uiData.scanlineType === 'horizontal' && (
        <motion.div
          className="absolute top-0 left-0 w-full h-[2px]"
          style={{ backgroundColor: uiData.colors.secondary, opacity: 0.4 }}
          animate={{ y: [0, 500, 0] }}
          transition={{ duration: (uiData.scanSpeed || 2) * 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {uiData.scanlineType === 'vertical' && (
        <motion.div
          className="absolute top-0 left-0 w-[2px] h-full"
          style={{ backgroundColor: uiData.colors.secondary, opacity: 0.4 }}
          animate={{ x: [0, 500, 0] }}
          transition={{ duration: (uiData.scanSpeed || 2) * 2, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {uiData.scanlineType === 'diagonal' && (
        <motion.div
          className="absolute top-0 left-0 w-[2px] h-full origin-top-left"
          style={{ 
            backgroundColor: uiData.colors.secondary, 
            opacity: 0.4,
            transform: 'rotate(45deg) translateX(-50%)'
          }}
          animate={{ x: [0, 707, 0] }} // sqrt(500^2 + 500^2)
          transition={{ duration: (uiData.scanSpeed || 2) * 3, repeat: Infinity, ease: "linear" }}
        />
      )}
      
      {uiData.scanlineType === 'circular' && (
        <motion.div
          className="absolute top-1/2 left-1/2 w-4 h-4 border-2 rounded-full"
          style={{ 
            borderColor: uiData.colors.secondary,
            opacity: 0.4,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{ 
            scale: [0, 20, 0],
            opacity: [0.6, 0.2, 0]
          }}
          transition={{ duration: (uiData.scanSpeed || 2) * 2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      
      {uiData.scanlineType === 'spiral' && (
        <motion.div
          className="absolute top-1/2 left-1/2 w-2 h-2"
          style={{ 
            backgroundColor: uiData.colors.secondary,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{ 
            rotate: [0, 720],
            scale: [1, 15, 1]
          }}
          transition={{ duration: (uiData.scanSpeed || 2) * 4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* Glitch Effects */}
      {uiData.glitchIntensity && uiData.glitchIntensity > 0 && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent ${95 - uiData.glitchIntensity * 10}%, ${uiData.colors.warning}40 ${97 - uiData.glitchIntensity * 5}%, transparent 100%)`
          }}
          animate={{ 
            x: [-10, 10, -10],
            opacity: [0, uiData.glitchIntensity, 0]
          }}
          transition={{ duration: 0.1, repeat: Infinity, repeatType: 'mirror' }}
        />
      )}

      {/* Bloom Effect */}
      {uiData.bloomEffect && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${uiData.colors.primary}20 0%, transparent 70%)`,
            filter: 'blur(2px)'
          }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [0.95, 1.05, 0.95]
          }}
          transition={{ duration: (uiData.pulseRate || 2), repeat: Infinity }}
        />
      )}

      {/* Chromatic Aberration */}
      {uiData.chromaShift && (
        <>
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(45deg, ${uiData.colors.primary}30 0%, transparent 50%, ${uiData.colors.secondary}30 100%)`
            }}
            animate={{ 
              x: [-2, 2, -2],
              y: [-1, 1, -1]
            }}
            transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(-45deg, ${uiData.colors.accent}30 0%, transparent 50%, ${uiData.colors.warning}30 100%)`
            }}
            animate={{ 
              x: [2, -2, 2],
              y: [1, -1, 1]
            }}
            transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}


    </div>
  );
}