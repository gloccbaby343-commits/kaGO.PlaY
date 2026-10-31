import { Track } from '../types/audio';

export interface FolderSummary {
  name: string;
  trackCount: number;
  totalDuration: number;
  totalSize: number;
  coverGradient: string;
  tracks: Track[];
  hasCustom: boolean;
}

/**
 * Extracts parent folder name from a relative file path (e.g., "Afrobeats/Song1.mp3" -> "Afrobeats")
 */
export function extractFolderNameFromPath(path: string): string | undefined {
  if (!path) return undefined;
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length > 1) {
    return parts[0].trim();
  }
  return undefined;
}

/**
 * Groups tracks into folders based on folderName property
 */
export function groupTracksByFolder(tracks: Track[]): FolderSummary[] {
  const map = new Map<string, Track[]>();

  for (const track of tracks) {
    if (track.folderName && track.folderName.trim()) {
      const folderName = track.folderName.trim();
      const list = map.get(folderName) || [];
      list.push(track);
      map.set(folderName, list);
    }
  }

  return Array.from(map.entries()).map(([name, folderTracks]) => {
    const totalDuration = folderTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    const totalSize = folderTracks.reduce((acc, t) => acc + (t.fileSize || 0), 0);
    const coverGradient = folderTracks[0]?.coverGradient || 'from-red-600 via-rose-700 to-black';
    const hasCustom = folderTracks.some((t) => t.isCustom);

    return {
      name,
      trackCount: folderTracks.length,
      totalDuration,
      totalSize,
      coverGradient,
      tracks: folderTracks,
      hasCustom,
    };
  });
}

/**
 * Reads and filters tracks within a specific folder, supporting search
 */
export function getTracksInFolder(
  tracks: Track[],
  folderName: string,
  searchQuery = ''
): Track[] {
  const folderTracks = tracks.filter((t) => t.folderName === folderName);
  const q = searchQuery.trim().toLowerCase();
  if (!q) return folderTracks;

  return folderTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.fileName && t.fileName.toLowerCase().includes(q))
  );
}
