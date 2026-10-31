import { Track, LyricLine, TrackLyrics } from '../types/audio';
import { toEnglishOnly } from '../utils/englishSanitizer';
import { parseLRC as parseLrcFull, getActiveLyricIndex as getActiveLyricIndexFull } from '../utils/lrcParser';

// In-memory cache for fetched lyrics to avoid repeated network requests
const lyricsCache = new Map<string, TrackLyrics>();

/**
 * Parses LRC format string into structured LyricLine[] using robust parser
 */
export function parseLRC(lrcText: string): LyricLine[] {
  return parseLrcFull(lrcText).lines;
}

export { getActiveLyricIndexFull as getActiveLyricIndex };

/**
 * Fetches synchronized lyrics for a track using the external metadata service (LRCLIB),
 * local cache, or procedural demo engine.
 */
export async function fetchTrackLyrics(track: Track): Promise<TrackLyrics> {
  if (!track) {
    return {
      trackId: '',
      parsedLines: [],
      source: 'None',
      isInstrumental: false,
    };
  }

  // 1. Check in-memory cache
  if (lyricsCache.has(track.id)) {
    return lyricsCache.get(track.id)!;
  }

  // 2. Check if track already has embedded synced lyrics or loaded .lrc file
  const rawLrc = track.syncedLyrics || track.lrcContent;
  if (rawLrc) {
    const parsed = parseLrcFull(rawLrc);
    const item: TrackLyrics = {
      trackId: track.id,
      syncedLyrics: rawLrc,
      plainLyrics: track.plainLyrics,
      parsedLines: parsed.lines,
      source: track.lrcFileName ? `LRC File (${track.lrcFileName})` : 'Synchronized LRC',
      isInstrumental: parsed.lines.length === 0,
    };
    lyricsCache.set(track.id, item);
    return item;
  }

  try {
    // 3. Query backend proxy route /api/lyrics
    const queryParams = new URLSearchParams({
      track: track.title,
      artist: track.artist,
      album: track.album || '',
      duration: track.duration ? String(track.duration) : '0',
    });

    const response = await fetch(`/api/lyrics?${queryParams.toString()}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && (data.syncedLyrics || data.plainLyrics || data.isInstrumental)) {
        const parsedLines = data.syncedLyrics ? parseLRC(data.syncedLyrics) : [];
        const result: TrackLyrics = {
          trackId: track.id,
          syncedLyrics: data.syncedLyrics || undefined,
          plainLyrics: data.plainLyrics || undefined,
          parsedLines,
          source: data.source || 'LRCLIB External Metadata Service',
          isInstrumental: !!data.isInstrumental,
        };
        lyricsCache.set(track.id, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Backend lyrics proxy unavailable, attempting client direct fetch:', err);
  }

  // 4. Client-side direct fallback to LRCLIB API if running client-only
  try {
    const lrcUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track.title)}${
      track.artist && track.artist !== 'Local Artist' ? `&artist_name=${encodeURIComponent(track.artist)}` : ''
    }`;
    const directResp = await fetch(lrcUrl, {
      headers: {
        'User-Agent': 'AuraWaveMusicPlayer/1.0',
      },
    });

    if (directResp.ok) {
      const data = await directResp.json();
      if (data.syncedLyrics || data.plainLyrics || data.instrumental) {
        const parsedLines = data.syncedLyrics ? parseLRC(data.syncedLyrics) : [];
        const result: TrackLyrics = {
          trackId: track.id,
          syncedLyrics: data.syncedLyrics || undefined,
          plainLyrics: data.plainLyrics || undefined,
          parsedLines,
          source: 'LRCLIB Direct Metadata Service',
          isInstrumental: !!data.instrumental,
        };
        lyricsCache.set(track.id, result);
        return result;
      }
    }
  } catch (directErr) {
    console.warn('Direct LRCLIB metadata fetch failed:', directErr);
  }

  // 5. Fallback for instrumental or tracks without registered lyrics
  const fallbackResult: TrackLyrics = {
    trackId: track.id,
    parsedLines: [
      { time: 0, text: `♪ ${track.title} ♪` },
      { time: Math.max(2, Math.floor((track.duration || 30) * 0.1)), text: `Artist: ${track.artist}` },
      { time: Math.max(5, Math.floor((track.duration || 30) * 0.3)), text: '(Instrumental audio / No online lyrics found)' },
      { time: Math.max(10, Math.floor((track.duration || 30) * 0.7)), text: 'Enjoy the high-fidelity offline audio playback' },
    ],
    source: 'Instrumental / Offline Generator',
    isInstrumental: true,
  };

  lyricsCache.set(track.id, fallbackResult);
  return fallbackResult;
}
