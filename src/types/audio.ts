export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string; // ObjectURL, synthetic source URL, or youtube link
  format: 'mp3' | 'wav' | 'flac' | 'aac' | 'ogg' | 'm4a' | 'synthetic' | 'youtube';
  youtubeId?: string; // YouTube Video ID for direct streaming
  coverArtUrl?: string;
  coverGradient: string;
  fileSize?: number; // bytes
  bitrate?: number; // kbps
  addedAt: number; // timestamp
  isFavorite?: boolean;
  isCustom?: boolean; // uploaded by user from device
  fileName?: string;
  folderName?: string; // Name of uploaded device folder
  syncedLyrics?: string; // Standard LRC timestamped text
  plainLyrics?: string;
  lrcContent?: string; // Raw LRC file content
  lrcFileName?: string; // Original .lrc filename (e.g. song.lrc)
  hasSyncedLyrics?: boolean;
  lrcOffset?: number; // Timing offset in seconds for playback calibration
}

export interface UploadedFolder {
  id: string;
  name: string;
  trackCount: number;
  totalDuration: number;
  tracks: Track[];
  coverGradient?: string;
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface TrackLyrics {
  trackId: string;
  syncedLyrics?: string;
  plainLyrics?: string;
  parsedLines: LyricLine[];
  source: string;
  isInstrumental?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerBand {
  frequency: number;
  label: string;
  gain: number; // -12dB to +12dB
}

export interface EqualizerPreset {
  name: string;
  gains: number[]; // 5 band values
  bassBoost?: number;
  bassBoostEnabled?: boolean;
}

export interface PlaybackSettings {
  crossfadeDuration: number; // in seconds (0 = gapless cut, >0 = blend duration)
  gaplessEnabled: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  activeTrackId: string | null;
  queue: Track[];
  queueIndex: number;
}

export type ActiveTab = 'dashboard' | 'youtube' | 'songs' | 'albums' | 'artists' | 'playlists' | 'favorites' | 'ai_studio' | 'architecture';

export interface YouTubeSearchResult {
  id: string; // videoId
  title: string;
  fullTitle?: string;
  artist: string;
  durationStr: string;
  durationSeconds: number;
  thumbnail: string;
  views?: string;
}
