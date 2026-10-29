import type { Playlist, Track } from '../types/audio.ts';

export function createPlaylist(name: string, description: string = '', color?: string): Playlist {
  const colors = [
    'from-red-600 to-rose-700',
    'from-rose-600 to-red-800',
    'from-red-700 to-zinc-950',
    'from-rose-700 to-black',
    'from-red-500 to-stone-900',
  ];
  const assignedColor = color || colors[Math.floor(Math.random() * colors.length)];
  const now = Date.now();
  return {
    id: `pl_${now}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim() || 'Untitled Playlist',
    description: description.trim(),
    trackIds: [],
    color: assignedColor,
    createdAt: now,
    updatedAt: now,
  };
}

export function addTracksToPlaylist(playlist: Playlist, trackIds: string[]): Playlist {
  const existingSet = new Set(playlist.trackIds);
  const updatedIds = [...playlist.trackIds];
  for (const id of trackIds) {
    if (!existingSet.has(id)) {
      existingSet.add(id);
      updatedIds.push(id);
    }
  }
  return {
    ...playlist,
    trackIds: updatedIds,
    updatedAt: Date.now(),
  };
}

export function removeTrackFromPlaylist(playlist: Playlist, trackId: string): Playlist {
  return {
    ...playlist,
    trackIds: playlist.trackIds.filter((id) => id !== trackId),
    updatedAt: Date.now(),
  };
}

export function filterTracks(tracks: Track[], searchQuery: string): Track[] {
  if (!searchQuery.trim()) return tracks;
  const q = searchQuery.toLowerCase().trim();
  return tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      (t.fileName && t.fileName.toLowerCase().includes(q))
  );
}

export function groupTracksByAlbum(tracks: Track[]): { album: string; artist: string; tracks: Track[]; coverGradient: string; coverArtUrl?: string }[] {
  const map = new Map<string, Track[]>();
  for (const track of tracks) {
    const key = `${track.album || 'Unknown Album'}___${track.artist || 'Unknown Artist'}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(track);
  }

  return Array.from(map.entries()).map(([key, group]) => {
    const [album, artist] = key.split('___');
    return {
      album,
      artist,
      tracks: group,
      coverGradient: group[0].coverGradient,
      coverArtUrl: group[0].coverArtUrl,
    };
  });
}

export function groupTracksByArtist(tracks: Track[]): { artist: string; tracks: Track[]; albumCount: number; coverGradient: string }[] {
  const map = new Map<string, Track[]>();
  for (const track of tracks) {
    const artist = track.artist || 'Unknown Artist';
    if (!map.has(artist)) map.set(artist, []);
    map.get(artist)!.push(track);
  }

  return Array.from(map.entries()).map(([artist, group]) => {
    const albums = new Set(group.map((t) => t.album));
    return {
      artist,
      tracks: group,
      albumCount: albums.size,
      coverGradient: group[0].coverGradient,
    };
  });
}
