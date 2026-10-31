import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProceduralVisualizerArt } from './visualizerArtGenerator.ts';

test('generateProceduralVisualizerArt produces valid SVG data URL containing title and artist', () => {
  const result = generateProceduralVisualizerArt({
    title: 'hetera by elvo',
    artist: 'elvo',
    genre: 'Afrobeat',
  });

  assert.ok(result.startsWith('data:image/svg+xml;utf8,'));
  const decoded = decodeURIComponent(result.replace('data:image/svg+xml;utf8,', ''));

  assert.ok(decoded.includes('<svg'));
  assert.ok(decoded.includes('</svg>'));
  assert.ok(decoded.includes('viewBox="0 0 600 600"'));
  assert.ok(decoded.includes('hetera by elvo'));
  assert.ok(decoded.includes('elvo'));
  assert.ok(decoded.includes('visualizer-core'));
});

test('generateProceduralVisualizerArt handles empty or special character titles', () => {
  const result = generateProceduralVisualizerArt({
    title: 'Rock & Roll <Live> "Hits"',
    artist: 'Band & Co',
  });

  assert.ok(result.startsWith('data:image/svg+xml;utf8,'));
  const decoded = decodeURIComponent(result.replace('data:image/svg+xml;utf8,', ''));
  assert.ok(decoded.includes('Rock &amp; Roll &lt;Live&gt;'));
});
