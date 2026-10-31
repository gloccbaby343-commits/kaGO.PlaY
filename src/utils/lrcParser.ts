import { LyricLine } from '../types/audio';

export interface LrcMetadata {
  title?: string;
  artist?: string;
  album?: string;
  creator?: string;
  offset?: number; // in seconds (from [offset:+/-ms])
}

export interface ParsedLrcResult {
  lines: LyricLine[];
  metadata: LrcMetadata;
  hasTimestamps: boolean;
  rawText: string;
}

/**
 * Parses standard and extended LRC format string into structured LyricLine[] and metadata.
 * Supports:
 * - [mm:ss.xx] (centiseconds)
 * - [mm:ss.xxx] (milliseconds)
 * - [mm:ss] (seconds only)
 * - Multi-timestamp lines: [00:12.50][00:25.00] Repeated chorus line
 * - ID metadata tags: [ti:], [ar:], [al:], [by:], [offset:+500] (milliseconds)
 */
export function parseLRC(lrcText: string): ParsedLrcResult {
  if (!lrcText || typeof lrcText !== 'string') {
    return {
      lines: [],
      metadata: {},
      hasTimestamps: false,
      rawText: '',
    };
  }

  const rawLines = lrcText.split(/\r?\n/);
  const parsedLines: LyricLine[] = [];
  const metadata: LrcMetadata = {};

  // Standard timestamp pattern: [mm:ss.xx] or [mm:ss.xxx] or [mm:ss]
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  // Metadata tag pattern: [tag:value]
  const tagRegex = /^\[([a-zA-Z]+):(.*)\]$/;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check for ID metadata tags
    const tagMatch = trimmed.match(tagRegex);
    if (tagMatch) {
      const key = tagMatch[1].toLowerCase();
      const val = tagMatch[2].trim();

      if (key === 'ti') metadata.title = val;
      else if (key === 'ar') metadata.artist = val;
      else if (key === 'al') metadata.album = val;
      else if (key === 'by') metadata.creator = val;
      else if (key === 'offset') {
        const offsetMs = parseFloat(val);
        if (!isNaN(offsetMs)) {
          metadata.offset = offsetMs / 1000;
        }
      }
      // If it's a metadata tag and not a lyric line with timestamp, continue
      if (!/\[\d{1,2}:\d{2}/.test(trimmed)) {
        continue;
      }
    }

    // Extract all timestamps from this line
    const timestamps: number[] = [];
    timeRegex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fracStr = match[3] || '0';
      const millis = parseInt(fracStr.padEnd(3, '0').slice(0, 3), 10);
      const timeInSeconds = minutes * 60 + seconds + millis / 1000;
      timestamps.push(timeInSeconds);
    }

    if (timestamps.length === 0) continue;

    // Clean lyric text by removing all timestamp tokens
    const text = trimmed.replace(timeRegex, '').trim();

    for (const time of timestamps) {
      parsedLines.push({
        time: parseFloat(time.toFixed(3)),
        text: text || '♪',
      });
    }
  }

  // Apply metadata offset if present (positive offset means lyrics appear later)
  const metaOffset = metadata.offset || 0;
  if (metaOffset !== 0) {
    for (const line of parsedLines) {
      line.time = Math.max(0, parseFloat((line.time + metaOffset).toFixed(3)));
    }
  }

  // Sort strictly by timestamp
  parsedLines.sort((a, b) => a.time - b.time);

  return {
    lines: parsedLines,
    metadata,
    hasTimestamps: parsedLines.length > 0,
    rawText: lrcText,
  };
}

/**
 * Finds the currently active lyric line index based on current playback time in seconds.
 * Performs binary or linear search and handles timing offsets.
 */
export function getActiveLyricIndex(
  lines: LyricLine[],
  currentTime: number,
  calibrationOffsetSeconds = 0
): number {
  if (!lines || lines.length === 0) return -1;

  const effectiveTime = currentTime + calibrationOffsetSeconds;

  // Before the first lyric line
  if (effectiveTime < lines[0].time) {
    return -1;
  }

  // Binary search for closest line with time <= effectiveTime
  let low = 0;
  let high = lines.length - 1;
  let result = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lines[mid].time <= effectiveTime) {
      result = mid;
      low = mid + 1; // Look for a later line that also qualifies
    } else {
      high = mid - 1;
    }
  }

  return result;
}

/**
 * Reads a .lrc File from browser File object and parses it.
 */
export async function parseLrcFile(file: File): Promise<ParsedLrcResult> {
  const text = await file.text();
  return parseLRC(text);
}
