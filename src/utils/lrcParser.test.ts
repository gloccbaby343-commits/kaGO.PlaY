import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseLRC, getActiveLyricIndex } from './lrcParser';

describe('LRC Parser Utilities', () => {
  it('parses standard timestamped lines accurately', () => {
    const lrc = `
[00:04.20] First line of the song
[00:08.50] Second line follows
[00:15.00] Chorus section begins
`;
    const result = parseLRC(lrc);
    assert.equal(result.lines.length, 3);
    assert.equal(result.lines[0].time, 4.2);
    assert.equal(result.lines[0].text, 'First line of the song');
    assert.equal(result.lines[1].time, 8.5);
    assert.equal(result.lines[2].time, 15);
    assert.equal(result.hasTimestamps, true);
  });

  it('extracts metadata tags including title, artist, and offset', () => {
    const lrc = `
[ti:Neon Horizon]
[ar:Aura Studio]
[al:Retrowave Nights]
[offset:+500]
[00:02.00] Driving through neon lights
`;
    const result = parseLRC(lrc);
    assert.equal(result.metadata.title, 'Neon Horizon');
    assert.equal(result.metadata.artist, 'Aura Studio');
    assert.equal(result.metadata.album, 'Retrowave Nights');
    assert.equal(result.metadata.offset, 0.5);
    // Line at 2.0s with +0.5s offset should shift to 2.5s
    assert.equal(result.lines[0].time, 2.5);
  });

  it('handles multi-timestamp repeated lines', () => {
    const lrc = `
[00:10.00][00:20.00] Repeated chorus hook
`;
    const result = parseLRC(lrc);
    assert.equal(result.lines.length, 2);
    assert.equal(result.lines[0].time, 10.0);
    assert.equal(result.lines[0].text, 'Repeated chorus hook');
    assert.equal(result.lines[1].time, 20.0);
    assert.equal(result.lines[1].text, 'Repeated chorus hook');
  });

  it('handles empty or malformed input safely', () => {
    const emptyResult = parseLRC('');
    assert.equal(emptyResult.lines.length, 0);
    assert.equal(emptyResult.hasTimestamps, false);

    const noTimestamps = parseLRC('Plain text lyrics without any timestamps');
    assert.equal(noTimestamps.lines.length, 0);
    assert.equal(noTimestamps.hasTimestamps, false);
  });

  it('locates the active lyric line index using getActiveLyricIndex', () => {
    const lines = [
      { time: 5.0, text: 'Line 1' },
      { time: 10.0, text: 'Line 2' },
      { time: 18.0, text: 'Line 3' },
      { time: 25.0, text: 'Line 4' },
    ];

    // Before any line has started
    assert.equal(getActiveLyricIndex(lines, 2.0), -1);

    // Exact match for Line 1
    assert.equal(getActiveLyricIndex(lines, 5.0), 0);

    // In between Line 1 and Line 2
    assert.equal(getActiveLyricIndex(lines, 7.5), 0);

    // Exact match for Line 2
    assert.equal(getActiveLyricIndex(lines, 10.0), 1);

    // In between Line 2 and Line 3
    assert.equal(getActiveLyricIndex(lines, 14.0), 1);

    // After last line
    assert.equal(getActiveLyricIndex(lines, 30.0), 3);

    // Calibration offset test: with +2s offset, time 8s behaves like 10s (Line 2)
    assert.equal(getActiveLyricIndex(lines, 8.0, 2.0), 1);
  });
});
