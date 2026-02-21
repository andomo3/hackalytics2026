import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicRetroUI } from './DynamicRetroUI';

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

interface GeneratedUI {
  theme: string;
  uiData: UIData;
}

export function RetroUIShuffler() {
  const [currentUI, setCurrentUI] = useState<GeneratedUI | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoShuffle, setAutoShuffle] = useState(true);

  const generateNewUI = () => {
    setIsLoading(true);
    
    const themes = [
      'alien_specimen', 'space_radar', 'system_diagnostics', 'arcade_stats', 'data_analysis',
      'medical_scanner', 'security_grid', 'navigation_hub', 'mining_ops', 'comms_station',
      'weapon_systems', 'life_support', 'quantum_lab', 'hydroponics', 'reactor_core',
      'stellar_chart', 'biometric_scan', 'tactical_ops', 'research_pod', 'cargo_bay',
      'cyberpunk_terminal', 'matrix_interface', 'hologram_display', 'neural_network', 'time_machine',
      'starship_bridge', 'alien_communication', 'robot_diagnostics', 'space_station', 'laboratory_ai',
      'cryogenic_chamber', 'teleporter_hub', 'gravity_control', 'energy_harvester', 'mind_scanner',
      'dimension_portal', 'nano_assembler', 'plasma_cannon', 'force_field', 'time_dilation',
      'warp_drive', 'bio_enhancement', 'cyber_implant', 'dna_sequencer', 'quantum_computer',
      'dark_matter', 'antimatter_core', 'photon_torpedo', 'shield_generator', 'tractor_beam',
      'subspace_relay', 'temporal_flux', 'phase_shift', 'ionic_storm', 'solar_flare',
      'black_hole', 'neutron_star', 'pulsar_array', 'gamma_burst', 'cosmic_rays',
      'exoplanet_scan', 'asteroid_mining', 'comet_tracker', 'nebula_analysis', 'supernova_watch'
    ];
    
    const colorPalettes = [
      { primary: '#00ff00', secondary: '#00ffff', accent: '#ff00ff', warning: '#ff0000' }, // Classic green
      { primary: '#00ff00', secondary: '#ffff00', accent: '#ffffff', warning: '#ff6600' }, // Green/yellow
      { primary: '#00ffff', secondary: '#00ff00', accent: '#ffffff', warning: '#ff6600' }, // Cyan primary
      { primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00', warning: '#ff0000' }, // Magenta primary
      { primary: '#ffff00', secondary: '#ff00ff', accent: '#00ffff', warning: '#ff0000' }, // Yellow primary
      { primary: '#ff6600', secondary: '#ffff00', accent: '#ffffff', warning: '#ff0000' }, // Orange retro
      { primary: '#00ff88', secondary: '#88ffff', accent: '#ff8800', warning: '#ff0044' }, // Mint green
      { primary: '#8800ff', secondary: '#00ffff', accent: '#ffff00', warning: '#ff4400' }, // Purple primary
      { primary: '#ff0088', secondary: '#00ff88', accent: '#88ff00', warning: '#ffff00' }, // Hot pink
      { primary: '#00aaff', secondary: '#ffaa00', accent: '#aa00ff', warning: '#ff0000' }, // Blue/orange
      { primary: '#44ff44', secondary: '#4444ff', accent: '#ff4444', warning: '#ffff44' }, // RGB classic
      { primary: '#ff8844', secondary: '#44ff88', accent: '#8844ff', warning: '#ff4488' }, // Warm palette
      { primary: '#00ff44', secondary: '#ff0044', accent: '#4400ff', warning: '#ffff00' }, // Toxic green
      { primary: '#ff00aa', secondary: '#00aaff', accent: '#aaff00', warning: '#ff4400' }, // Neon pink
      { primary: '#aa00ff', secondary: '#ff0088', accent: '#00ff88', warning: '#ffaa00' }, // Electric purple
      { primary: '#ffaa00', secondary: '#aa00ff', accent: '#00ffaa', warning: '#ff0044' }, // Solar orange
      { primary: '#00ffaa', secondary: '#ffaa44', accent: '#aa44ff', warning: '#ff0000' }, // Aqua mint
      { primary: '#ff4400', secondary: '#00ff44', accent: '#4400ff', warning: '#ffff44' }, // Fire red
      { primary: '#4400ff', secondary: '#ff4400', accent: '#00ff44', warning: '#ffaa00' }, // Deep blue
      { primary: '#ffffff', secondary: '#888888', accent: '#444444', warning: '#ff0000' }, // Monochrome
      { primary: '#00ff00', secondary: '#008800', accent: '#004400', warning: '#ff4400' }, // Matrix green
      { primary: '#0088ff', secondary: '#0044aa', accent: '#002266', warning: '#ff8800' }, // Ice blue
      { primary: '#ff8800', secondary: '#aa4400', accent: '#662200', warning: '#ffff00' }, // Amber
      { primary: '#ff0066', secondary: '#990033', accent: '#660022', warning: '#ffff88' }, // Hot magenta
      { primary: '#66ff00', secondary: '#339900', accent: '#226600', warning: '#ff6600' }, // Lime acid
      { primary: '#ff6600', secondary: '#cc3300', accent: '#881100', warning: '#ffff44' }, // Sunset
      { primary: '#0066ff', secondary: '#003399', accent: '#002266', warning: '#ff8844' }, // Ocean blue
      { primary: '#cc00ff', secondary: '#660088', accent: '#330044', warning: '#ffaa44' }, // Violet
      { primary: '#ffcc00', secondary: '#996600', accent: '#663300', warning: '#ff4488' }, // Gold
      { primary: '#00ccff', secondary: '#006699', accent: '#003366', warning: '#ff6644' }, // Sky blue
      { primary: '#ff3366', secondary: '#991122', accent: '#660011', warning: '#ffcc44' }, // Cherry
      { primary: '#33ff66', secondary: '#119933', accent: '#006622', warning: '#ff8833' }, // Forest
      { primary: '#ff9933', secondary: '#cc5500', accent: '#882200', warning: '#66ff66' }, // Copper
      { primary: '#3366ff', secondary: '#112299', accent: '#001166', warning: '#ffff33' }, // Royal blue
      { primary: '#ff6633', secondary: '#cc2211', accent: '#881100', warning: '#88ff88' }, // Rust
      { primary: '#66ff33', secondary: '#339911', accent: '#226600', warning: '#ff3366' }  // Spring green
    ];
    
    const titleSets = [
      ['XENOBIOLOGY LAB', 'SPECIMEN ANALYSIS', 'FLORA SCANNER', 'BIO RESEARCH', 'GENETIC MATRIX'],
      ['DEEP SPACE RADAR', 'NAVIGATION HUB', 'STELLAR CHART', 'SPACE TRAFFIC', 'ORBITAL SCAN'],
      ['SYSTEM STATUS', 'CORE MONITOR', 'DIAGNOSTIC HUB', 'SYSTEM HEALTH', 'POWER GRID'],
      ['PLAYER STATS', 'CHARACTER DATA', 'SKILL MATRIX', 'INVENTORY SCAN', 'LEVEL TRACKER'],
      ['DATA PROCESSOR', 'QUANTUM CORE', 'NEURAL NET', 'AI INTERFACE', 'LOGIC ENGINE'],
      ['MEDICAL SCANNER', 'VITAL SIGNS', 'HEALTH MATRIX', 'BIO MONITOR', 'LIFE SUPPORT'],
      ['SECURITY GRID', 'THREAT LEVEL', 'ALERT SYSTEM', 'DEFENSE NET', 'PERIMETER SCAN'],
      ['MINING OPS', 'RESOURCE SCAN', 'EXCAVATION', 'MINERAL SURVEY', 'CARGO STATUS'],
      ['COMMS STATION', 'SIGNAL BOOST', 'TRANSMISSION', 'RELAY NETWORK', 'DATA STREAM'],
      ['WEAPON SYSTEMS', 'TARGETING', 'AMMUNITION', 'BALLISTICS', 'COMBAT READY'],
      ['REACTOR CORE', 'FUSION CHAMBER', 'ENERGY OUTPUT', 'PLASMA FIELD', 'POWER MATRIX'],
      ['HYDROPONICS', 'GROWTH CYCLE', 'NUTRIENT FLOW', 'CROP SCANNER', 'BIO GARDEN'],
      ['CYBERPUNK NET', 'NEURAL LINK', 'DATA JACK', 'MIND BRIDGE', 'GHOST PROTOCOL'],
      ['HOLOGRAM DECK', 'LIGHT FIELD', 'PROJECTION', 'VIRTUAL SPACE', 'PHOTON MESH'],
      ['TIME MACHINE', 'TEMPORAL FLUX', 'CHRONOMETER', 'TIME STREAM', 'PARADOX ENGINE'],
      ['ALIEN COMMS', 'XENO SIGNAL', 'TRANSLATION', 'FIRST CONTACT', 'CIPHER MATRIX'],
      ['ROBOT BRAIN', 'LOGIC CORE', 'SERVO CONTROL', 'MOTOR FUNCTION', 'AI DIAGNOSTICS'],
      ['SPACE STATION', 'ORBITAL DOCK', 'GRAVITY DECK', 'AIRLOCK STATUS', 'DOCKING BAY'],
      ['CRYO CHAMBER', 'FREEZE PROTOCOL', 'STASIS FIELD', 'HIBERNATION', 'REVIVAL SEQUENCE'],
      ['TELEPORTER', 'MATTER STREAM', 'QUANTUM GATE', 'TRANSPORT PAD', 'BEAM MATRIX'],
      ['GRAVITY WELL', 'FIELD GENERATOR', 'MASS ANCHOR', 'GRAV CONTROL', 'WEIGHT MATRIX'],
      ['ENERGY FARM', 'POWER HARVEST', 'SOLAR ARRAY', 'FUSION PLANT', 'BATTERY GRID'],
      ['MIND PROBE', 'THOUGHT SCAN', 'BRAIN WAVE', 'CONSCIOUSNESS', 'MEMORY BANK'],
      ['PORTAL GATE', 'DIMENSION RIFT', 'SPACE FOLD', 'WARP TUNNEL', 'VOID BRIDGE'],
      ['NANO FACTORY', 'MOLECULAR BUILD', 'ATOM FORGE', 'MICRO ASSEMBLY', 'PARTICLE CRAFT'],
      ['PLASMA GUN', 'ION CANNON', 'LASER ARRAY', 'PHOTON BLAST', 'ENERGY WEAPON'],
      ['FORCE SHIELD', 'BARRIER FIELD', 'DEFLECTOR', 'PROTECTION GRID', 'SAFETY MATRIX'],
      ['WARP ENGINE', 'FTL DRIVE', 'HYPERDRIVE', 'JUMP GATE', 'SPACE FOLD'],
      ['BIO ENHANCE', 'GENE THERAPY', 'MUTATION LAB', 'DNA SPLICE', 'EVOLUTION CHAMBER'],
      ['CYBER IMPLANT', 'NEURAL CHIP', 'BRAIN UPGRADE', 'TECH GRAFT', 'AUGMENTATION'],
      ['DNA MACHINE', 'GENE READER', 'HELIX SCAN', 'CHROMOSOME', 'GENETIC CODE'],
      ['QUANTUM CPU', 'SUPER COMPUTER', 'LOGIC MATRIX', 'PROCESSING CORE', 'DATA BRAIN'],
      ['DARK ENERGY', 'VOID POWER', 'SHADOW MATTER', 'COSMIC FORCE', 'UNIVERSE ENGINE'],
      ['ANTIMATTER', 'ANTI PARTICLE', 'ENERGY INVERSE', 'MATTER BOMB', 'ANNIHILATION'],
      ['PHOTON TUBE', 'LIGHT TORPEDO', 'ENERGY MISSILE', 'BEAM WEAPON', 'LASER BOLT'],
      ['SHIELD DOME', 'ENERGY BARRIER', 'PROTECTION FIELD', 'SAFETY BUBBLE', 'GUARD MATRIX'],
      ['TRACTOR RAY', 'GRAVITY BEAM', 'PULL FIELD', 'MASS MANIPULATOR', 'FORCE TETHER'],
      ['SUBSPACE NET', 'QUANTUM RELAY', 'SPACE BRIDGE', 'VOID NETWORK', 'DIMENSION LINK'],
      ['TIME STORM', 'TEMPORAL WAVE', 'CHRONO FIELD', 'TIME DISTORTION', 'FLUX CASCADE'],
      ['PHASE TECH', 'MATTER SHIFT', 'SOLID PASS', 'GHOST MODE', 'QUANTUM PHASE'],
      ['ION STORM', 'PARTICLE RAIN', 'ELECTRIC CLOUD', 'CHARGE FIELD', 'PLASMA WEATHER'],
      ['SOLAR FLARE', 'STAR BURST', 'RADIATION WAVE', 'COSMIC STORM', 'ENERGY ERUPTION'],
      ['BLACK HOLE', 'GRAVITY WELL', 'SPACE VOID', 'MASS SINGULARITY', 'EVENT HORIZON'],
      ['NEUTRON STAR', 'DENSE MATTER', 'GRAVITY FIELD', 'STELLAR CORE', 'MASS COMPACT'],
      ['PULSAR BEAM', 'RADIO PULSE', 'STELLAR LIGHTHOUSE', 'COSMIC BEACON', 'STAR SIGNAL'],
      ['GAMMA RAY', 'HIGH ENERGY', 'COSMIC RADIATION', 'SPACE LASER', 'STELLAR DEATH'],
      ['COSMIC RAYS', 'PARTICLE STORM', 'SPACE RADIATION', 'STELLAR WIND', 'ENERGY SHOWER'],
      ['EXOPLANET', 'ALIEN WORLD', 'DISTANT EARTH', 'NEW PLANET', 'FOREIGN SPHERE'],
      ['ASTEROID MINE', 'ROCK HARVEST', 'SPACE QUARRY', 'MINERAL BELT', 'ORE FIELD'],
      ['COMET TAIL', 'ICE ROCK', 'DIRTY SNOWBALL', 'SPACE DEBRIS', 'FROZEN WANDERER'],
      ['NEBULA GAS', 'STAR NURSERY', 'COSMIC CLOUD', 'SPACE FOG', 'STELLAR BIRTH'],
      ['SUPERNOVA', 'STAR EXPLOSION', 'STELLAR DEATH', 'COSMIC BOMB', 'SPACE FIREWORKS']
    ];
    
    const layouts = [
      'classic_split', 'quad_grid', 'vertical_stack', 'horizontal_strip', 'L_shape',
      'center_focus', 'corner_panels', 'triple_column', 'asymmetric', 'circular_hub',
      'hexagon_grid', 'spiral_layout', 'diamond_formation', 'triangular_matrix', 'cross_pattern',
      'radial_burst', 'wave_formation', 'zigzag_pattern', 'concentric_rings', 'fibonacci_spiral',
      'crystal_structure', 'neural_network', 'branching_tree', 'cellular_grid', 'fractal_pattern',
      'orbital_rings', 'stacked_layers', 'interleaved_columns', 'mosaic_tiles', 'honeycomb_cells'
    ];
    
    const randomThemeIndex = Math.floor(Math.random() * themes.length);
    const randomColorIndex = Math.floor(Math.random() * colorPalettes.length);
    const randomTitleSet = Math.floor(Math.random() * titleSets.length);
    const randomTitleIndex = Math.floor(Math.random() * titleSets[randomTitleSet].length);
    const randomLayout = layouts[Math.floor(Math.random() * layouts.length)];

    const scanlineTypes = ['horizontal', 'vertical', 'diagonal', 'crosshatch', 'circular', 'spiral'];
    const randomScanlineType = scanlineTypes[Math.floor(Math.random() * scanlineTypes.length)];

    const newUI: GeneratedUI = {
      theme: themes[randomThemeIndex],
      uiData: {
        title: titleSets[randomTitleSet][randomTitleIndex],
        colors: colorPalettes[randomColorIndex],
        panels: Math.floor(Math.random() * 8) + 4, // 4-11 panels
        hasParticles: Math.random() > 0.15, // More likely to have particles
        hasRadar: Math.random() > 0.35,
        hasBarChart: Math.random() > 0.25,
        hasLineGraph: Math.random() > 0.25,
        hasHeatMap: Math.random() > 0.35,
        animationSpeed: Math.random() * 3 + 0.3, // 0.3-3.3
        particleCount: Math.floor(Math.random() * 50) + 20, // 20-70 particles
        layout: randomLayout,
        centerElement: Math.floor(Math.random() * 12), // More center elements
        hasWaveform: Math.random() > 0.4,
        hasSpectrum: Math.random() > 0.5,
        hasStatusGrid: Math.random() > 0.3,
        hasProgressRings: Math.random() > 0.4,
        // New visualization types
        hasDNAHelix: Math.random() > 0.6,
        hasOscilloscope: Math.random() > 0.5,
        hasWireframe3D: Math.random() > 0.7,
        hasNetworkTopology: Math.random() > 0.6,
        hasSignalAnalysis: Math.random() > 0.5,
        hasFrequencyBands: Math.random() > 0.4,
        hasDataStreams: Math.random() > 0.3,
        hasMatrixRain: Math.random() > 0.8,
        hasHologramGrid: Math.random() > 0.6,
        hasQuantumField: Math.random() > 0.7,
        hasEnergyPulse: Math.random() > 0.4,
        hasGravityWaves: Math.random() > 0.6,
        hasTimeDilation: Math.random() > 0.8,
        hasPlasmaBurst: Math.random() > 0.7,
        hasNeuralPaths: Math.random() > 0.6,
        hasCrystalLattice: Math.random() > 0.7,
        // Aesthetic properties
        scanlineType: randomScanlineType,
        glitchIntensity: Math.random() * 0.5, // 0-0.5
        bloomEffect: Math.random() > 0.5,
        chromaShift: Math.random() > 0.6,
        scanSpeed: Math.random() * 2 + 0.5, // 0.5-2.5
        pulseRate: Math.random() * 3 + 1, // 1-4
        distortionLevel: Math.random() * 0.3 // 0-0.3
      }
    };
    
    setCurrentUI(newUI);
    setIsLoading(false);
  };

  // Auto shuffle every 10 seconds
  useEffect(() => {
    if (!autoShuffle) return;
    
    const interval = setInterval(() => {
      generateNewUI();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoShuffle]);

  // Generate initial UI
  useEffect(() => {
    generateNewUI();
  }, []);

  const toggleAutoShuffle = () => {
    setAutoShuffle(!autoShuffle);
  };

  return (
    <div className="w-full h-full relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <motion.button
          onClick={toggleAutoShuffle}
          className={`px-4 py-2 border font-mono text-xs ${
            autoShuffle 
              ? 'border-green-400 text-black bg-green-400 bg-opacity-20' 
              : 'border-gray-400 text-gray-400'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          AUTO: {autoShuffle ? 'ON' : 'OFF'}
        </motion.button>
        
        <motion.button
          onClick={generateNewUI}
          disabled={isLoading}
          className="px-4 py-2 border border-cyan-400 text-cyan-400 font-mono text-xs hover:bg-cyan-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isLoading ? 1 : 1.05 }}
          whileTap={{ scale: isLoading ? 1 : 0.95 }}
        >
          {isLoading ? 'GENERATING...' : 'SHUFFLE'}
        </motion.button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-20">
          <motion.div className="text-cyan-400 font-mono text-xl">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              LOADING NEW INTERFACE...
            </motion.span>
          </motion.div>
        </div>
      )}

      {/* UI Display */}
      <AnimatePresence mode="wait">
        {currentUI && (
          <motion.div
            key={currentUI.theme + Date.now()}
            initial={{ 
              opacity: 0,
              scaleY: 0.02,
              filter: 'brightness(3) contrast(2)'
            }}
            animate={{ 
              opacity: [0, 0.7, 1],
              scaleY: [0.02, 1.03, 1],
              filter: [
                'brightness(3) contrast(2)',
                'brightness(1.2) contrast(1.1)',
                'brightness(1) contrast(1)'
              ]
            }}
            exit={{ 
              opacity: [1, 0.3, 0],
              scaleY: [1, 1.02, 0.01],
              filter: [
                'brightness(1) contrast(1)',
                'brightness(2) contrast(2)',
                'brightness(0) contrast(0)'
              ]
            }}
            transition={{ 
              duration: 0.15,
              ease: "easeOut"
            }}
            className="w-full h-full relative"
          >
            <DynamicRetroUI uiData={currentUI.uiData} />
            
            {/* CRT Scanlines Effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 255, 0.03) 2px,
                  rgba(0, 255, 255, 0.03) 4px
                )`
              }}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: [0.8, 0.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Quick Refresh Flash */}
            <motion.div
              className="absolute inset-0 bg-cyan-400 pointer-events-none"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.05 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}