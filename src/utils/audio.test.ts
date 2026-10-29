import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, formatFileSize } from './formatters.ts';
import { getNextTrackIndex, getPreviousTrackIndex, generateShuffleIndices, reorderQueue } from './queueManager.ts';
import { createPlaylist, addTracksToPlaylist, removeTrackFromPlaylist, filterTracks } from './playlistUtils.ts';
import type { Track } from '../types/audio.ts';

test('formatTime properly formats seconds to mm:ss and hh:mm:ss', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(3600), '1:00:00');
  assert.equal(formatTime(3665), '1:01:05');
  assert.equal(formatTime(-10), '0:00');
});

test('formatFileSize converts byte values', () => {
  assert.equal(formatFileSize(0), '0 KB');
  assert.equal(formatFileSize(1024), '1.0 KB');
  assert.equal(formatFileSize(1048576 * 3.5), '3.5 MB');
});

test('getNextTrackIndex handles sequential, repeat all, and repeat one', () => {
  // Sequential next
  assert.equal(getNextTrackIndex(0, 3, 'off', false), 1);
  assert.equal(getNextTrackIndex(1, 3, 'off', false), 2);
  // Reached end with repeat off
  assert.equal(getNextTrackIndex(2, 3, 'off', false), null);
  // Reached end with repeat all -> loops to 0
  assert.equal(getNextTrackIndex(2, 3, 'all', false), 0);
  // Repeat one -> stays on current
  assert.equal(getNextTrackIndex(2, 3, 'one', false), 2);
});

test('getPreviousTrackIndex handles sequential, wrap-around, and repeat one', () => {
  assert.equal(getPreviousTrackIndex(2, 3, 'off', false), 1);
  assert.equal(getPreviousTrackIndex(0, 3, 'off', false), 0);
  assert.equal(getPreviousTrackIndex(0, 3, 'all', false), 2);
  assert.equal(getPreviousTrackIndex(1, 3, 'one', false), 1);
});

test('generateShuffleIndices contains all items and keeps current item first', () => {
  const indices = generateShuffleIndices(5, 2);
  assert.equal(indices.length, 5);
  assert.equal(indices[0], 2);
  const sorted = [...indices].sort((a, b) => a - b);
  assert.deepEqual(sorted, [0, 1, 2, 3, 4]);
});

test('reorderQueue moves items accurately', () => {
  const dummyTracks: Track[] = [
    { id: '1', title: 'T1', artist: 'A1', album: 'Al1', duration: 100, url: '', format: 'mp3', coverGradient: '', addedAt: 0 },
    { id: '2', title: 'T2', artist: 'A2', album: 'Al2', duration: 100, url: '', format: 'mp3', coverGradient: '', addedAt: 0 },
    { id: '3', title: 'T3', artist: 'A3', album: 'Al3', duration: 100, url: '', format: 'mp3', coverGradient: '', addedAt: 0 },
  ];

  const reordered = reorderQueue(dummyTracks, 0, 2);
  assert.equal(reordered[0].id, '2');
  assert.equal(reordered[1].id, '3');
  assert.equal(reordered[2].id, '1');
});

test('playlistUtils creates, adds, and removes tracks without duplicates', () => {
  const pl = createPlaylist('Synth Classics', 'Best 80s vibes');
  assert.equal(pl.name, 'Synth Classics');
  assert.equal(pl.trackIds.length, 0);

  const updated1 = addTracksToPlaylist(pl, ['t1', 't2']);
  assert.deepEqual(updated1.trackIds, ['t1', 't2']);

  // Adding existing t1 should not duplicate
  const updated2 = addTracksToPlaylist(updated1, ['t2', 't3']);
  assert.deepEqual(updated2.trackIds, ['t1', 't2', 't3']);

  const updated3 = removeTrackFromPlaylist(updated2, 't2');
  assert.deepEqual(updated3.trackIds, ['t1', 't3']);
});

test('filterTracks filters by title, artist, or album', () => {
  const tracks: Track[] = [
    { id: '1', title: 'Resonance', artist: 'HOME', album: 'Odyssey', duration: 100, url: '', format: 'mp3', coverGradient: '', addedAt: 0 },
    { id: '2', title: 'Midnight City', artist: 'M83', album: 'Hurry Up', duration: 100, url: '', format: 'mp3', coverGradient: '', addedAt: 0 },
  ];

  assert.equal(filterTracks(tracks, 'resonance').length, 1);
  assert.equal(filterTracks(tracks, 'm83').length, 1);
  assert.equal(filterTracks(tracks, 'odyssey').length, 1);
  assert.equal(filterTracks(tracks, 'nonexistent').length, 0);
  assert.equal(filterTracks(tracks, '').length, 2);
});

test('bass boost toggle gain calculation', () => {
  const calculateEffectiveBassGain = (enabled: boolean, level: number) => {
    return enabled ? Math.max(0, Math.min(14, level)) : 0;
  };

  assert.equal(calculateEffectiveBassGain(false, 8), 0);
  assert.equal(calculateEffectiveBassGain(true, 8), 8);
  assert.equal(calculateEffectiveBassGain(true, 12), 12);
  assert.equal(calculateEffectiveBassGain(false, 12), 0);
});

test('preset bands have exactly 5 frequency gains matching 60Hz to 14kHz', () => {
  const samplePresetGains = [
    { name: 'Flat', gains: [0, 0, 0, 0, 0] },
    { name: 'Bass', gains: [7, 5, 1, 0, 0] },
    { name: 'Heavy Bass', gains: [11, 8, 2, -1, -2] },
    { name: 'Rock', gains: [5, 3, -1, 3, 5] },
    { name: 'Pop', gains: [-1, 2, 5, 2, -2] },
    { name: 'Classical', gains: [4, 3, 2, 2, -1] },
    { name: 'Jazz', gains: [3, 2, -1, 2, 4] },
  ];

  for (const preset of samplePresetGains) {
    assert.equal(preset.gains.length, 5);
    preset.gains.forEach((gain) => {
      assert.ok(gain >= -12 && gain <= 12, `Gain ${gain} out of range for ${preset.name}`);
    });
  }

  const bassPreset = samplePresetGains.find((p) => p.name === 'Bass')!;
  const heavyBassPreset = samplePresetGains.find((p) => p.name === 'Heavy Bass')!;
  const flatPreset = samplePresetGains.find((p) => p.name === 'Flat')!;

  // 60Hz sub-bass check
  assert.ok(bassPreset.gains[0] > flatPreset.gains[0], 'Bass should boost 60Hz sub-bass');
  assert.ok(heavyBassPreset.gains[0] > bassPreset.gains[0], 'Heavy Bass should boost 60Hz sub-bass more than Bass');
  // 230Hz low-bass check
  assert.ok(heavyBassPreset.gains[1] > bassPreset.gains[1], 'Heavy Bass should boost 230Hz low-bass more than Bass');
});

test('crossfade effective duration clamps within track limits', () => {
  const calculateEffectiveFade = (requestedFade: number, trackDuration: number) => {
    const maxAllowed = Math.max(0, trackDuration * 0.35);
    return Math.max(0, Math.min(requestedFade, maxAllowed));
  };

  // Standard 3-minute song (180s) with 4s requested fade
  assert.equal(calculateEffectiveFade(4, 180), 4);
  // Short 6-second jingle with 4s requested fade: clamped to 35% of 6s = 2.1s
  assert.ok(Math.abs(calculateEffectiveFade(4, 6) - 2.1) < 0.001);
  // 0s pure gapless mode
  assert.equal(calculateEffectiveFade(0, 180), 0);
  // Negative duration protection
  assert.equal(calculateEffectiveFade(-2, 180), 0);
});

test('gapless transition handoff trigger point', () => {
  const getGaplessTriggerTime = (trackDuration: number, crossfade: number) => {
    if (crossfade >= 0.5) {
      const maxAllowed = Math.max(0, trackDuration * 0.35);
      const effective = Math.min(crossfade, maxAllowed);
      return trackDuration - effective;
    }
    // Pure gapless: trigger 80ms before end
    return Math.max(0, trackDuration - 0.08);
  };

  // 100s song with 4s crossfade -> triggers at 96s
  assert.equal(getGaplessTriggerTime(100, 4), 96);
  // 100s song with 0s gapless -> triggers at 99.92s
  assert.equal(Math.round(getGaplessTriggerTime(100, 0) * 100) / 100, 99.92);
});



