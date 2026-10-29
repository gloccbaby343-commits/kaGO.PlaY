import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLRC, getActiveLyricIndex } from './lyricsService';
import { toEnglishOnly, sanitizeTrackToEnglish } from '../utils/englishSanitizer';

test('parseLRC parses timestamps and ignores metadata tags correctly', () => {
  const lrc = `
[ti:Neon Horizon]
[ar:Aura Synth]
[al:Retrowave Dreams]
[00:04.50]Driving through the midnight rain
[00:12.80]Streetlights glowing bright again
[00:20.00]Bass resonates in the night
  `.trim();

  const parsed = parseLRC(lrc);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].time, 4.5);
  assert.equal(parsed[0].text, 'Driving through the midnight rain');
  assert.equal(parsed[1].time, 12.8);
  assert.equal(parsed[1].text, 'Streetlights glowing bright again');
  assert.equal(parsed[2].time, 20.0);
  assert.equal(parsed[2].text, 'Bass resonates in the night');
});

test('parseLRC handles multiple timestamps per line and chronological sorting', () => {
  const lrc = `[00:30.00][00:10.00]Chorus line repeats here`;
  const parsed = parseLRC(lrc);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].time, 10.0);
  assert.equal(parsed[1].time, 30.0);
  assert.equal(parsed[0].text, 'Chorus line repeats here');
  assert.equal(parsed[1].text, 'Chorus line repeats here');
});

test('getActiveLyricIndex accurately locates active line with timing offsets', () => {
  const lines = [
    { time: 5.0, text: 'First verse' },
    { time: 10.0, text: 'Second verse' },
    { time: 20.0, text: 'Chorus begins' },
  ];

  // Before first line
  assert.equal(getActiveLyricIndex(lines, 2.0), 0);

  // Exactly at line 1
  assert.equal(getActiveLyricIndex(lines, 5.0), 0);

  // In between line 1 and 2
  assert.equal(getActiveLyricIndex(lines, 7.5), 0);

  // At line 2
  assert.equal(getActiveLyricIndex(lines, 10.0), 1);

  // At line 3
  assert.equal(getActiveLyricIndex(lines, 22.0), 2);

  // With positive offset (+3s makes currentTime 2.0 become 5.0)
  assert.equal(getActiveLyricIndex(lines, 2.0, 3.0), 0);

  // With negative offset (-5s makes currentTime 15.0 become 10.0)
  assert.equal(getActiveLyricIndex(lines, 15.0, -5.0), 1);
});

test('englishSanitizer normalizes foreign diacritics and enforces English labels', () => {
  // Normalization of diacritics while preserving original song title
  assert.equal(toEnglishOnly('Café del Mar'), 'Cafe del Mar');
  assert.equal(toEnglishOnly('Hélène'), 'Helene');

  // Non-Latin replacement fallback
  const sanitized = sanitizeTrackToEnglish({
    id: 'test-1',
    title: '夜に駆ける',
    artist: 'YOASOBI',
    album: 'THE BOOK',
    duration: 180,
    url: 'blob:fake-audio',
    addedAt: Date.now(),
    format: 'mp3',
    fileSize: 4000000,
    coverGradient: 'from-red-600 to-rose-700',
  }, 1);

  assert.ok(sanitized.title.length > 0 && /^[A-Za-z0-9\s.,'?!-]+$/.test(sanitized.title));
  assert.equal(sanitized.artist, 'YOASOBI');
});
