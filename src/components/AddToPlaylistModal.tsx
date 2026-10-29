import React, { useState } from 'react';
import { ListPlus, X, Check, Plus } from 'lucide-react';
import { Playlist, Track } from '../types/audio';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  onToggleTrackInPlaylist: (playlistId: string, trackId: string) => void;
  onCreateNewPlaylist: (name: string) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  onToggleTrackInPlaylist,
  onCreateNewPlaylist,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !track) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreateNewPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 pt-[max(env(safe-area-inset-top,0px),1.75rem)] pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-black border border-zinc-900 shadow-2xl p-5 text-zinc-100 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-bold">Add to Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-2.5 px-3 my-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${track.coverGradient} flex items-center justify-center text-xs font-bold shrink-0 text-white`}>
            ♪
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">{track.title}</p>
            <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
          </div>
        </div>

        {/* Existing Playlists */}
        <div className="flex-1 overflow-y-auto space-y-1.5 py-1">
          {playlists.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">No playlists yet. Create one below!</p>
          ) : (
            playlists.map((pl) => {
              const hasTrack = pl.trackIds.includes(track.id);
              return (
                <button
                  key={pl.id}
                  onClick={() => onToggleTrackInPlaylist(pl.id, track.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 transition text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${pl.color} flex items-center justify-center shrink-0`}>
                      <span className="text-[10px] text-white font-bold">{pl.trackIds.length}</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                      {pl.name}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      hasTrack
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'border-zinc-800 group-hover:border-zinc-600'
                    }`}
                  >
                    {hasTrack && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Quick create new playlist */}
        <div className="mt-3 pt-3 border-t border-zinc-900">
          {isCreating ? (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="New playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium text-white shadow-sm shadow-red-600/30"
              >
                Create
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-800 hover:border-red-500/50 hover:bg-red-500/5 text-xs text-red-400 font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Playlist</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
