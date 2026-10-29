import { Track, LyricLine, TrackLyrics } from '../types/audio';
import { toEnglishOnly } from '../utils/englishSanitizer';

// In-memory cache for fetched lyrics to avoid repeated network requests
const lyricsCache = new Map<string, TrackLyrics>();

/**
 * Parses LRC format string (e.g. [01:23.45] Lyric line text) into structured LyricLine[]
 */
export function parseLRC(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  // Match standard timestamp [mm:ss.xx] or [mm:ss.xxx] or [mm:ss]
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata tags like [ti:Title], [ar:Artist], [al:Album], [offset:0]
    if (/^\[(ti|ar|al|by|offset|length|re|ve):/i.test(trimmed)) {
      continue;
    }

    // Extract all timestamps on this line
    const timestamps: number[] = [];
    let match: RegExpExecArray | null;

    // Reset regex index
    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millisStr = match[3] || '0';
      const millis = parseInt(millisStr.padEnd(3, '0').slice(0, 3), 10);

      const totalSeconds = minutes * 60 + seconds + millis / 1000;
      timestamps.push(totalSeconds);
    }

    if (timestamps.length === 0) continue;

    // Strip timestamps to get the lyric text
    const textPart = trimmed.replace(timeRegex, '').trim();
    const cleanText = textPart ? toEnglishOnly(textPart, textPart) : '♪';

    for (const time of timestamps) {
      result.push({
        time,
        text: cleanText,
      });
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.time - b.time);

  return result;
}

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

  // 2. Check if track already has embedded synced lyrics
  if (track.syncedLyrics) {
    const parsed = parseLRC(track.syncedLyrics);
    const item: TrackLyrics = {
      trackId: track.id,
      syncedLyrics: track.syncedLyrics,
      plainLyrics: track.plainLyrics,
      parsedLines: parsed,
      source: 'Embedded Audio Tags',
      isInstrumental: parsed.length === 0,
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

/**
 * Finds the index of the currently active lyric line for currentTime + offsetSeconds
 */
export function getActiveLyricIndex(
  lines: LyricLine[],
  currentTime: number,
  offsetSeconds: number = 0
): number {
  if (!lines || lines.length === 0) return -1;

  const adjustedTime = Math.max(0, currentTime + offsetSeconds);

  // If before the first line
  if (adjustedTime < lines[0].time) {
    return 0;
  }

  // Linear search from top
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    if (adjustedTime >= current.time && (!next || adjustedTime < next.time)) {
      return i;
    }
  }

  return lines.length - 1;
}
