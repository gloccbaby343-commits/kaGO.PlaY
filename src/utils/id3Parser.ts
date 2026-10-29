import { Track } from '../types/audio';
import { generateCoverGradient } from './formatters';
import { sanitizeTrackToEnglish, toEnglishOnly } from './englishSanitizer';

/**
 * Extracts metadata and duration from an uploaded audio File
 */
export async function parseAudioFile(file: File): Promise<Track> {
  const url = URL.createObjectURL(file);
  const format = detectFormat(file);

  // Extract duration using lightweight hidden audio element
  const duration = await getAudioDuration(url);

  // Attempt ID3v2 tag extraction from buffer
  let title = '';
  let artist = '';
  let album = '';
  let coverArtUrl: string | undefined;

  try {
    const buffer = await file.slice(0, 512 * 1024).arrayBuffer(); // read first 512KB for ID3 header
    const tags = parseID3v2(buffer);
    if (tags) {
      if (tags.title && tags.title.trim() && !tags.title.toLowerCase().includes('english melody')) {
        title = tags.title.trim();
      }
      if (tags.artist && tags.artist.trim() && !tags.artist.toLowerCase().includes('english melody')) {
        artist = tags.artist.trim();
      }
      if (tags.album && tags.album.trim() && !tags.album.toLowerCase().includes('english melody')) {
        album = tags.album.trim();
      }
      if (tags.picture) {
        const picBlob = new Blob([tags.picture.data as any], { type: tags.picture.mime });
        coverArtUrl = URL.createObjectURL(picBlob);
      }
    }
  } catch (err) {
    console.warn('ID3 parsing skipped or failed for file:', file.name, err);
  }

  // Fallback to intelligent filename cleaning if tags are empty or placeholder
  if (!title || title.toLowerCase().includes('english melody')) {
    const cleaned = cleanFileName(file.name);
    title = cleaned.title;
    if (!artist || artist.toLowerCase().includes('english melody')) {
      artist = cleaned.artist;
    }
  }
  if (!artist || artist.toLowerCase().includes('english melody')) artist = 'Unknown Artist';
  if (!album || album.toLowerCase().includes('english melody')) album = 'Device Storage';

  const trackId = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const rawTrack: Track = {
    id: trackId,
    title: title || file.name.replace(/\.[^/.]+$/, ''),
    artist: artist || 'Unknown Artist',
    album: album || 'Device Storage',
    duration: Math.round(duration || 0),
    url,
    format,
    coverArtUrl,
    coverGradient: generateCoverGradient(title + artist),
    fileSize: file.size,
    addedAt: Date.now(),
    isFavorite: false,
    isCustom: true,
    fileName: file.name,
  };

  return rawTrack;
}

function detectFormat(file: File): Track['format'] {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'wav') return 'wav';
  if (ext === 'flac') return 'flac';
  if (ext === 'aac') return 'aac';
  if (ext === 'ogg') return 'ogg';
  if (ext === 'm4a') return 'm4a';
  return 'mp3';
}

function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    let resolved = false;

    const finish = (dur: number) => {
      if (resolved) return;
      resolved = true;
      audio.onloadedmetadata = null;
      audio.onerror = null;
      resolve(dur || 0);
    };

    const timer = setTimeout(() => {
      finish(audio.duration || 0);
    }, 600);

    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      finish(audio.duration || 0);
    };
    audio.onerror = () => {
      clearTimeout(timer);
      finish(0);
    };
    audio.src = url;
  });
}

export function cleanFileName(filename: string): { title: string; artist: string } {
  if (!filename) return { title: 'Unknown Track', artist: 'Unknown Artist' };

  // Remove extension (e.g. .mp3, .m4a, .wav)
  let base = filename.replace(/\.[a-zA-Z0-9]{2,5}$/i, '').trim();

  // Strip leading track numbers like "01 - " or "01. " or "01 " or "1- "
  base = base.replace(/^\d+[\s._-]+/, '').trim();

  // Clean underscores into spaces
  const cleanSpaces = base.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  // Check for "by" pattern e.g. "hetera by elvo" or "Song by Artist"
  const byMatch = cleanSpaces.match(/^(.*?)\s+by\s+(.*)$/i);
  if (byMatch && byMatch[1].trim() && byMatch[2].trim()) {
    return {
      // User requested: "if the song is called hetera by elvo...let the name be like that"
      title: cleanSpaces,
      artist: byMatch[2].trim(),
    };
  }

  // Check if separated by " - " e.g. "Daft Punk - Get Lucky"
  if (cleanSpaces.includes(' - ')) {
    const parts = cleanSpaces.split(' - ');
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim() || 'Unknown Artist',
        title: parts.slice(1).join(' - ').trim() || cleanSpaces,
      };
    }
  }

  // Exact filename as title
  return {
    title: cleanSpaces || base || filename,
    artist: 'Unknown Artist',
  };
}

interface ID3Result {
  title?: string;
  artist?: string;
  album?: string;
  picture?: { mime: string; data: Uint8Array };
}

function parseID3v2(buffer: ArrayBuffer): ID3Result | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 10) return null;

  // Check "ID3" header
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return null;
  }

  const version = bytes[3]; // e.g. 3 or 4
  const tagSize =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f);

  let offset = 10;
  const maxOffset = Math.min(bytes.length, 10 + tagSize);
  const result: ID3Result = {};

  while (offset + 10 < maxOffset) {
    const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    if (!frameId.match(/^[A-Z0-9]{4}$/)) break;

    let frameSize = 0;
    if (version === 4) {
      // Synchsafe integer
      frameSize =
        ((bytes[offset + 4] & 0x7f) << 21) |
        ((bytes[offset + 5] & 0x7f) << 14) |
        ((bytes[offset + 6] & 0x7f) << 7) |
        (bytes[offset + 7] & 0x7f);
    } else {
      frameSize =
        (bytes[offset + 4] << 24) |
        (bytes[offset + 5] << 16) |
        (bytes[offset + 6] << 8) |
        bytes[offset + 7];
    }

    if (frameSize <= 0 || offset + 10 + frameSize > maxOffset) break;

    const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);

    // Text frames (TIT2: Title, TPE1: Artist, TALB: Album)
    if (frameId === 'TIT2' || frameId === 'TPE1' || frameId === 'TALB') {
      const text = decodeTextFrame(frameData);
      if (frameId === 'TIT2' && text) result.title = text;
      if (frameId === 'TPE1' && text) result.artist = text;
      if (frameId === 'TALB' && text) result.album = text;
    } else if (frameId === 'APIC') {
      // Attached picture
      try {
        const pic = parseAPIC(frameData);
        if (pic) result.picture = pic;
      } catch {
        // ignore malformed picture
      }
    }

    offset += 10 + frameSize;
  }

  return result;
}

function decodeTextFrame(data: Uint8Array): string {
  if (data.length <= 1) return '';
  const encoding = data[0];
  const payload = data.subarray(1);

  let raw = '';
  try {
    if (encoding === 0) {
      // ISO-8859-1 / windows-1252 (Latin1 standard in ID3v2)
      raw = new TextDecoder('windows-1252').decode(payload);
    } else if (encoding === 1) {
      // UTF-16 with BOM
      raw = new TextDecoder('utf-16').decode(payload);
    } else if (encoding === 2) {
      // UTF-16BE without BOM
      raw = new TextDecoder('utf-16be').decode(payload);
    } else {
      // UTF-8
      raw = new TextDecoder('utf-8').decode(payload);
    }
  } catch {
    try {
      raw = new TextDecoder('utf-8').decode(payload);
    } catch {
      raw = '';
    }
  }

  // Remove null characters and trim
  raw = raw.replace(/\0/g, '').trim();

  // If decoding resulted in replacement characters (\uFFFD), try windows-1252 as fallback
  if (raw.includes('\uFFFD')) {
    try {
      const fallback = new TextDecoder('windows-1252').decode(payload).replace(/\0/g, '').trim();
      if (!fallback.includes('\uFFFD') && fallback.length > 0) {
        raw = fallback;
      }
    } catch {
      // keep raw
    }
  }

  // Clean unprintable characters
  return raw.replace(/[\uFFFD\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim();
}

function parseAPIC(data: Uint8Array): { mime: string; data: Uint8Array } | null {
  if (data.length < 5) return null;
  // byte 0: encoding
  let pos = 1;
  // MIME type (null terminated ASCII)
  let mime = '';
  while (pos < data.length && data[pos] !== 0) {
    mime += String.fromCharCode(data[pos]);
    pos++;
  }
  pos++; // skip null terminator
  if (pos >= data.length) return null;

  // Picture type (1 byte)
  pos++;
  // Description (null terminated)
  while (pos < data.length && data[pos] !== 0) {
    pos++;
  }
  pos++; // skip null
  if (pos >= data.length) return null;

  const imgData = data.subarray(pos);
  if (imgData.length === 0) return null;

  return {
    mime: mime || 'image/jpeg',
    data: imgData,
  };
}
