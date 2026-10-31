/**
 * Procedural SVG Visualizer Album Art Generator
 * Creates unique, deterministic, high-resolution visualizer album art
 * based on song title, artist name, and audio parameters.
 */

export interface VisualizerArtOptions {
  title: string;
  artist: string;
  genre?: string;
  style?: 'spectrum-radial' | 'waveform-grid' | 'vinyl-pulse' | 'cyber-bars';
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateProceduralVisualizerArt(options: VisualizerArtOptions): string {
  const { title, artist, genre = 'Electronic' } = options;
  const seed = `${title}-${artist}-${genre}`;
  const h = hashCode(seed);

  // Palettes in kaGO.PIaY red & black signature aesthetic
  const palettes = [
    { primary: '#ff3e3e', secondary: '#f43f5e', dark: '#0c0c0e', deep: '#18181b', accent: '#fda4af' },
    { primary: '#e11d48', secondary: '#be123c', dark: '#0a0a0c', deep: '#16161a', accent: '#fb7185' },
    { primary: '#ff2d55', secondary: '#991b1b', dark: '#070709', deep: '#121215', accent: '#ffe4e6' },
    { primary: '#dc2626', secondary: '#f87171', dark: '#08080a', deep: '#141418', accent: '#fca5a5' },
    { primary: '#ff4d4d', secondary: '#b91c1c', dark: '#0b0b0e', deep: '#1a1a20', accent: '#fecdd3' },
  ];
  const palette = palettes[h % palettes.length];

  const styles: VisualizerArtOptions['style'][] = [
    'spectrum-radial',
    'waveform-grid',
    'vinyl-pulse',
    'cyber-bars',
  ];
  const chosenStyle = options.style || styles[(h >> 2) % styles.length];

  // Generate waveform / visualizer bars
  let visualizerElements = '';

  if (chosenStyle === 'spectrum-radial') {
    const numBars = 48;
    const cx = 300;
    const cy = 270;
    const innerRadius = 70;

    for (let i = 0; i < numBars; i++) {
      const angle = (i / numBars) * Math.PI * 2;
      const barHeight = 20 + ((h * (i + 13)) % 90) * (0.5 + 0.5 * Math.sin(i * 0.4));
      const x1 = cx + Math.cos(angle) * innerRadius;
      const y1 = cy + Math.sin(angle) * innerRadius;
      const x2 = cx + Math.cos(angle) * (innerRadius + barHeight);
      const y2 = cy + Math.sin(angle) * (innerRadius + barHeight);
      const strokeColor = i % 2 === 0 ? palette.primary : palette.secondary;
      const strokeWidth = 3 + (i % 3);

      visualizerElements += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="0.85" filter="url(#glow)"/>`;
    }
  } else if (chosenStyle === 'cyber-bars') {
    const numBars = 32;
    const startX = 60;
    const barWidth = 12;
    const gap = 4;
    const baselineY = 360;

    for (let i = 0; i < numBars; i++) {
      const x = startX + i * (barWidth + gap);
      const val = Math.abs(Math.sin((i / numBars) * Math.PI * 2 + (h % 10))) * 180 + ((h * (i + 7)) % 40);
      const barH = Math.max(15, Math.min(220, val));
      const y = baselineY - barH;
      const col = i % 3 === 0 ? palette.accent : (i % 2 === 0 ? palette.primary : palette.secondary);

      visualizerElements += `<rect x="${x}" y="${y.toFixed(1)}" width="${barWidth}" height="${barH.toFixed(1)}" rx="4" fill="${col}" opacity="0.9" filter="url(#glow)"/>`;
      // Reflection
      visualizerElements += `<rect x="${x}" y="${baselineY + 8}" width="${barWidth}" height="${(barH * 0.35).toFixed(1)}" rx="3" fill="${col}" opacity="0.2"/>`;
    }
  } else if (chosenStyle === 'vinyl-pulse') {
    const cx = 300;
    const cy = 270;
    // Concentric grooves
    for (let r = 50; r <= 180; r += 16) {
      const op = 0.15 + 0.1 * ((r + h) % 3);
      visualizerElements += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.primary}" stroke-width="1.5" opacity="${op.toFixed(2)}"/>`;
    }
    // Radial sound rays
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const r1 = 110 + ((h * i) % 30);
      const r2 = 190 + ((h * (i + 3)) % 40);
      const x1 = cx + Math.cos(angle) * r1;
      const y1 = cy + Math.sin(angle) * r1;
      const x2 = cx + Math.cos(angle) * r2;
      const y2 = cy + Math.sin(angle) * r2;
      visualizerElements += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${palette.secondary}" stroke-width="2.5" stroke-linecap="round" opacity="0.75" filter="url(#glow)"/>`;
    }
  } else {
    // Waveform grid landscape
    const numPoints = 28;
    const startX = 50;
    const step = 500 / numPoints;
    let path1 = `M ${startX} 280 `;
    let path2 = `M ${startX} 280 `;

    for (let i = 0; i <= numPoints; i++) {
      const x = startX + i * step;
      const yOffset1 = Math.sin((i / numPoints) * Math.PI * 4 + h) * 60 + Math.cos(i * 1.5) * 30;
      const yOffset2 = Math.sin((i / numPoints) * Math.PI * 3 + h * 2) * 45;
      path1 += `L ${x.toFixed(1)} ${(280 + yOffset1).toFixed(1)} `;
      path2 += `L ${x.toFixed(1)} ${(280 + yOffset2).toFixed(1)} `;
    }

    visualizerElements += `<path d="${path1}" fill="none" stroke="${palette.primary}" stroke-width="4" stroke-linecap="round" filter="url(#glow)"/>`;
    visualizerElements += `<path d="${path2}" fill="none" stroke="${palette.secondary}" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>`;
  }

  // Escape XML characters in title & artist
  const cleanTitle = (title || 'Audio Track')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 32);

  const cleanArtist = (artist || 'Unknown Artist')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 32);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.deep}"/>
      <stop offset="50%" stop-color="${palette.dark}"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="${palette.primary}" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="${palette.secondary}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="600" height="600" fill="url(#bgGrad)"/>
  <rect width="600" height="600" fill="url(#centerGlow)"/>

  <!-- Subtle High-Tech Grid Lines -->
  <line x1="50" y1="50" x2="550" y2="50" stroke="#ffffff" stroke-opacity="0.08" stroke-dasharray="4,4"/>
  <line x1="50" y1="550" x2="550" y2="550" stroke="#ffffff" stroke-opacity="0.08" stroke-dasharray="4,4"/>
  <line x1="50" y1="50" x2="50" y2="550" stroke="#ffffff" stroke-opacity="0.08" stroke-dasharray="4,4"/>
  <line x1="550" y1="50" x2="550" y2="550" stroke="#ffffff" stroke-opacity="0.08" stroke-dasharray="4,4"/>

  <!-- Top Technical Corner Tags -->
  <text x="65" y="75" fill="${palette.primary}" font-family="monospace" font-size="11" font-weight="bold" letter-spacing="2">AUDIO.VISUALIZER.V2</text>
  <text x="535" y="75" text-anchor="end" fill="#ffffff" fill-opacity="0.4" font-family="monospace" font-size="10" letter-spacing="1.5">24-BIT • FLAC/MP3</text>

  <!-- Central Visualizer Pattern -->
  <g id="visualizer-core">
    ${visualizerElements}
  </g>

  <!-- Central Core Disc -->
  <circle cx="300" cy="270" r="32" fill="#000000" stroke="${palette.primary}" stroke-width="2.5" filter="url(#glow)"/>
  <circle cx="300" cy="270" r="8" fill="${palette.primary}"/>

  <!-- Bottom Title & Artist Plaque -->
  <rect x="50" y="445" width="500" height="90" rx="16" fill="#000000" fill-opacity="0.75" stroke="#ffffff" stroke-opacity="0.1"/>
  
  <!-- Accent Edge Bar -->
  <rect x="50" y="445" width="6" height="90" rx="3" fill="${palette.primary}"/>

  <!-- Typography -->
  <text x="75" y="482" fill="#ffffff" font-family="'Syne', 'Inter', system-ui, sans-serif" font-size="22" font-weight="800" letter-spacing="-0.5">${cleanTitle}</text>
  <text x="75" y="512" fill="${palette.accent}" font-family="system-ui, sans-serif" font-size="14" font-weight="600">${cleanArtist}</text>

  <!-- Mini Equalizer Graphic in Bottom Right -->
  <g transform="translate(480, 485)">
    <rect x="0" y="5" width="4" height="20" rx="2" fill="${palette.primary}"/>
    <rect x="7" y="0" width="4" height="25" rx="2" fill="${palette.primary}"/>
    <rect x="14" y="8" width="4" height="17" rx="2" fill="${palette.secondary}"/>
    <rect x="21" y="12" width="4" height="13" rx="2" fill="${palette.primary}"/>
    <rect x="28" y="3" width="4" height="22" rx="2" fill="${palette.accent}"/>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
