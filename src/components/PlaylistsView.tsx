import React, { useState } from 'react';
import { ListMusic, Plus, Play, ChevronLeft, MoreVertical, Edit2, Trash2, Shuffle, Clock, Music2 } from 'lucide-react';
import { Playlist, Track } from '../types/audio';
import { formatTime } from '../utils/formatters';

interface PlaylistsViewProps {
  playlists: Playlist[];
  allTracks: Track[];
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onOpenCreatePlaylist: () => void;
  onEditPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  allTracks,
  onPlayTrack,
  onOpenCreatePlaylist,
  onEditPlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  // Resolve tracks inside the selected playlist
  const playlistTracks = selectedPlaylist
    ? selectedPlaylist.trackIds
        .map((id) => allTracks.find((t) => t.id === id))
        .filter((t): t is Track => t !== undefined)
    : [];

  if (selectedPlaylist) {
    const totalDuration = playlistTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    return (
      <div className="space-y-6 animate-in fade-in duration-200 p-6 sm:p-10">
        <button
          onClick={() => setSelectedPlaylistId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Playlists</span>
        </button>

        {/* Playlist Hero */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl">
          <div
            className={`w-36 h-36 rounded-2xl bg-gradient-to-br ${selectedPlaylist.color} flex items-center justify-center shrink-0 shadow-xl`}
          >
            <ListMusic className="w-16 h-16 text-white/90" />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono uppercase text-red-500 font-bold">Custom Playlist</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate mt-1">
              {selectedPlaylist.name}
            </h1>
            {selectedPlaylist.description && (
              <p className="text-xs text-zinc-400 mt-1">{selectedPlaylist.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-xs text-zinc-400 font-mono">
              <span>{playlistTracks.length} songs</span>
              <span>•</span>
              <span>{formatTime(totalDuration)}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              {playlistTracks.length > 0 && (
                <>
                  <button
                    onClick={() => onPlayTrack(playlistTracks[0], playlistTracks)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play All</span>
                  </button>
                  <button
                    onClick={() => {
                      const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
                      onPlayTrack(shuffled[0], shuffled);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs border border-zinc-800 transition active:scale-95"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Shuffle</span>
                  </button>
                </>
              )}
              <button
                onClick={() => onEditPlaylist(selectedPlaylist)}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs border border-zinc-800 transition"
                title="Edit Playlist Details"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  onDeletePlaylist(selectedPlaylist.id);
                  setSelectedPlaylistId(null);
                }}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 text-xs border border-zinc-800 transition"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        {playlistTracks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-dashed border-zinc-900">
            <Music2 className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-zinc-300">Playlist is empty</h4>
            <p className="text-xs text-zinc-500 mt-1">
              Add songs from the All Songs view by tapping the (+) playlist icon on any track.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-900 bg-black">
            {playlistTracks.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                className="flex items-center justify-between p-3 sm:px-4 hover:bg-zinc-900/50 transition group"
              >
                <div
                  onClick={() => onPlayTrack(track, playlistTracks)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <span className="w-6 text-center text-xs font-mono font-bold text-zinc-500 group-hover:text-red-400">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {track.artist} • {track.album}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs font-mono text-zinc-400">{formatTime(track.duration)}</span>
                  <button
                    onClick={() => onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}
                    aria-label={`Remove ${track.title} from playlist`}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition"
                    title="Remove from Playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 p-6 sm:p-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-red-500" />
            <span>Playlists</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
              {playlists.length}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage your offline playlists</p>
        </div>

        <button
          onClick={onOpenCreatePlaylist}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Create Card Button */}
        <div
          onClick={onOpenCreatePlaylist}
          className="aspect-square rounded-2xl border-2 border-dashed border-zinc-900 hover:border-red-600/50 bg-zinc-950/40 hover:bg-red-950/10 transition cursor-pointer flex flex-col items-center justify-center text-center p-4 group"
        >
          <div className="w-12 h-12 rounded-xl bg-zinc-900 group-hover:bg-red-600 text-zinc-400 group-hover:text-white flex items-center justify-center transition-colors mb-2 shadow border border-zinc-800">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition">
            Create Playlist
          </span>
          <span className="text-[10px] text-zinc-500 mt-0.5">Custom collection</span>
        </div>

        {/* Existing Playlists */}
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => setSelectedPlaylistId(pl.id)}
            className="p-3 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 transition cursor-pointer group flex flex-col"
          >
            <div
              className={`aspect-square w-full rounded-xl bg-gradient-to-br ${pl.color} relative flex items-center justify-center overflow-hidden mb-3 shadow-md group-hover:scale-102 transition-transform`}
            >
              <ListMusic className="w-12 h-12 text-white/90" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>
            <h3 className="text-xs font-bold text-zinc-200 truncate group-hover:text-red-400 transition">
              {pl.name}
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              {pl.trackIds.length} track{pl.trackIds.length !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
