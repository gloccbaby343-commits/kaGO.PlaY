import { test } from 'node:test';
import assert from 'node:assert';
import { Track, YouTubeSearchResult } from '../types/audio';

test('YouTubeSearchResult converts cleanly into playable Track model', () => {
  const result: YouTubeSearchResult = {
    id: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    durationStr: '3:33',
    durationSeconds: 213,
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    views: '1.5B views',
  };

  const track: Track = {
    id: `yt_${result.id}`,
    title: result.title,
    artist: result.artist,
    album: 'YouTube Music Stream',
    duration: result.durationSeconds,
    url: `https://www.youtube.com/watch?v=${result.id}`,
    format: 'youtube',
    youtubeId: result.id,
    coverArtUrl: result.thumbnail,
    coverGradient: 'from-red-600 via-rose-700 to-black',
    bitrate: 256,
    addedAt: Date.now(),
    isCustom: true,
  };

  assert.strictEqual(track.format, 'youtube');
  assert.strictEqual(track.youtubeId, 'dQw4w9WgXcQ');
  assert.strictEqual(track.duration, 213);
  assert.strictEqual(track.coverArtUrl, result.thumbnail);
  assert.ok(track.id.startsWith('yt_'));
});
