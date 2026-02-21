import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)



// Retro UI themes and prompts
const retroThemes = [
  {
    name: 'alien_specimen',
    prompts: [
      'retro sci-fi alien plant analysis terminal interface, green phosphor screen, pixelated graphics, specimen data readouts',
      'vintage computer analyzing alien mineral samples, amber monochrome display, technical diagrams, data streams',
      'cyberpunk alien creature examination interface, cyan and magenta colors, holographic displays, warning messages'
    ]
  },
  {
    name: 'space_radar',
    prompts: [
      'retro space radar interface, green circular sweeping display, spacecraft blips, coordinate readouts',
      'vintage satellite tracking system, amber CRT monitor, orbital paths, technical specifications',
      'cyberpunk deep space scanner, neon purple interface, asteroid fields, threat assessments'
    ]
  },
  {
    name: 'system_diagnostics',
    prompts: [
      'retro computer system diagnostics, green text on black background, memory usage bars, CPU temperature',
      'vintage mainframe status terminal, amber phosphor display, process lists, error logs',
      'cyberpunk system monitor interface, neon blue and pink, network traffic graphs, security alerts'
    ]
  },
  {
    name: 'arcade_stats',
    prompts: [
      'retro arcade game statistics screen, pixelated interface, high scores, player stats in bright colors',
      'vintage gaming terminal, 8-bit style graphics, level progression charts, achievement unlocks',
      'cyberpunk gaming interface, holographic displays, player rankings, tournament brackets'
    ]
  },
  {
    name: 'data_analysis',
    prompts: [
      'retro data analysis terminal, green matrix-style code scrolling, statistical graphs, processing status',
      'vintage laboratory computer interface, amber scientific readouts, chemical formulas, test results',
      'cyberpunk data mining interface, neon visualizations, network graphs, AI analysis results'
    ]
  }
];

app.post('/make-server-f4460a75/generate-retro-ui', async (c) => {
  try {
    console.log('🚀 Starting retro UI generation...');

    // Select random theme
    const theme = retroThemes[Math.floor(Math.random() * retroThemes.length)];
    console.log(`🎨 Selected theme: ${theme.name}`);

    // Generate UI component data based on theme
    const uiData = generateUIComponentData(theme.name);

    // Store the generated UI data
    const uiId = `retro-ui-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await kv.set(uiId, {
      theme: theme.name,
      uiData: uiData,
      timestamp: Date.now()
    });

    return c.json({
      success: true,
      theme: theme.name,
      uiData: uiData
    });

  } catch (error) {
    console.log(`Server error: ${error.message}`);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// Generate UI component data based on theme
function generateUIComponentData(theme: string) {
  const baseColors = {
    alien_specimen: { primary: '#00ff00', secondary: '#00ffff', accent: '#ff00ff', warning: '#ff0000' },
    space_radar: { primary: '#00ff00', secondary: '#ffff00', accent: '#ffffff', warning: '#ff6600' },
    system_diagnostics: { primary: '#00ff00', secondary: '#00ffff', accent: '#ffffff', warning: '#ff0000' },
    arcade_stats: { primary: '#ff00ff', secondary: '#00ffff', accent: '#ffff00', warning: '#ff0000' },
    data_analysis: { primary: '#00ffff', secondary: '#00ff00', accent: '#ffffff', warning: '#ff6600' }
  };

  const titles = {
    alien_specimen: ['XENOBIOLOGY LAB', 'SPECIMEN ANALYSIS', 'ALIEN FLORA STUDY', 'BIOFORM SCANNER'],
    space_radar: ['DEEP SPACE RADAR', 'ORBITAL TRACKER', 'NAVIGATION GRID', 'SENSOR ARRAY'],
    system_diagnostics: ['SYSTEM STATUS', 'DIAGNOSTICS PANEL', 'MAINFRAME MONITOR', 'CORE SYSTEMS'],
    arcade_stats: ['PLAYER STATS', 'GAME TERMINAL', 'SCORE MATRIX', 'ARCADE SYSTEM'],
    data_analysis: ['DATA PROCESSOR', 'ANALYSIS TERMINAL', 'RESEARCH GRID', 'INFO MATRIX']
  };

  const randomTitle = titles[theme][Math.floor(Math.random() * titles[theme].length)];
  const colors = baseColors[theme];

  return {
    title: randomTitle,
    colors: colors,
    panels: Math.floor(Math.random() * 3) + 2, // 2-4 panels
    hasParticles: Math.random() > 0.3,
    hasRadar: theme === 'space_radar' || Math.random() > 0.7,
    hasBarChart: Math.random() > 0.4,
    hasLineGraph: Math.random() > 0.5,
    hasHeatMap: Math.random() > 0.6,
    animationSpeed: Math.random() * 2 + 1, // 1-3 seconds
    particleCount: Math.floor(Math.random() * 20) + 10
  };
}

app.get('/make-server-f4460a75/health', (c) => {
  return c.json({ status: 'healthy', timestamp: Date.now() });
});



Deno.serve(app.fetch);