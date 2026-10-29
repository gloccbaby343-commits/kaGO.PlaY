import React, { useState } from 'react';
import {
  Play,
  Shuffle,
  Heart,
  ListPlus,
  ArrowUpDown,
  Music2,
  Trash2,
  HardDrive,
  Volume2,
  Pencil,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Track } from '../types/audio';
import { formatTime, formatFileSize } from '../utils/formatters';

interface SongsViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onShuffleAll: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onDeleteTrack?: (id: string) => void;
  onOpenScanner: () => void;
  onPickAndPlayFile?: (file: File) => void;
  onRenameTrack?: (id: string, newTitle: string, newArtist: string) => void;
  onClearCorruptedTracks?: () => void;
}

export const SongsView: React.FC<SongsViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onShuffleAll,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onDeleteTrack,
  onOpenScanner,
  onPickAndPlayFile,
  onRenameTrack,
  onClearCorruptedTracks,
}) => {
  const songsFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration' | 'added'>('title');

  // Track Rename Dialog State
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');

  const hasCorrupted = tracks.some(
    (t) =>
      t.title.toLowerCase().includes('english melody') ||
      t.title.toLowerCase().includes('melody english')
  );

  const handleStartRename = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrack && editTitle.trim() && onRenameTrack) {
      onRenameTrack(editingTrack.id, editTitle.trim(), editArtist.trim() || 'Unknown Artist');
    }
    setEditingTrack(null);
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
    if (sortBy === 'duration') return b.duration - a.duration;
    return b.addedAt - a.addedAt;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 p-6 sm:p-10">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-red-500" />
            <span>All Songs</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
              {tracks.length}
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Offline device music storage & audio library
          </p>
        </div>

        {/* Hidden File Input */}
        <input
          ref={songsFileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0] && onPickAndPlayFile) {
              onPickAndPlayFile(e.target.files[0]);
              e.target.value = '';
            }
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Pick Song Button */}
          <button
            onClick={() => songsFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition active:scale-95"
            title="Select an audio file from your device to play offline immediately"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Select Song from Storage</span>
          </button>

          {/* Quick Clear Legacy Corrupted Button if present */}
          {hasCorrupted && onClearCorruptedTracks && (
            <button
              onClick={onClearCorruptedTracks}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs border border-amber-500/30 transition active:scale-95"
              title="Delete old placeholder tracks with English Melody names"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Clear Corrupted Placeholders</span>
            </button>
          )}

          {tracks.length > 0 && (
            <>
              <button
                onClick={() => onPlayTrack(sortedTracks[0], sortedTracks)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-600/20 transition active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play All</span>
              </button>
              <button
                onClick={onShuffleAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs border border-zinc-800 transition active:scale-95"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
            </>
          )}

          {/* Sort Menu */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="title" className="bg-zinc-950 text-zinc-200">Title</option>
              <option value="artist" className="bg-zinc-950 text-zinc-200">Artist</option>
              <option value="duration" className="bg-zinc-950 text-zinc-200">Duration</option>
              <option value="added" className="bg-zinc-950 text-zinc-200">Date Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Song List */}
      {sortedTracks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-dashed border-zinc-800">
          <Music2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No songs found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Scan your phone or computer storage to load your offline MP3, WAV, and FLAC audio files.
          </p>
          <button
            onClick={onOpenScanner}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-600/30 transition"
          >
            <HardDrive className="w-4 h-4" />
            <span>Scan Device Audio</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-900 bg-black/60 overflow-hidden">
          {sortedTracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                className={`group flex items-center justify-between p-3 sm:px-4 sm:py-3 transition-colors ${
                  isCurrent ? 'bg-red-950/40 border-l-2 border-red-500' : 'hover:bg-zinc-950/80'
                }`}
              >
                {/* Left index & Title */}
                <div
                  onClick={() => onPlayTrack(track, sortedTracks)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="w-6 text-center text-xs font-mono font-bold text-zinc-500 shrink-0">
                    {isCurrent ? (
                      isPlaying ? (
                        <Volume2 className="w-4 h-4 text-red-500 animate-pulse mx-auto" />
                      ) : (
                        <span className="text-red-500">⏸</span>
                      )
                    ) : (
                      <span className="group-hover:hidden">{idx + 1}</span>
                    )}
                    {!isCurrent && (
                      <Play className="w-3.5 h-3.5 fill-current text-white hidden group-hover:block mx-auto" />
                    )}
                  </div>

                  {/* Artwork */}
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.coverGradient} flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}
                  >
                    {track.coverArtUrl ? (
                      <img
                        src={track.coverArtUrl}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-white/80">♪</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isCurrent ? 'text-red-400 font-bold' : 'text-zinc-200 group-hover:text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {track.artist} • <span className="text-zinc-500">{track.album}</span>
                    </p>
                  </div>
                </div>

                {/* Right Metadata & Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-3 ml-2 shrink-0">
                  <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono uppercase font-semibold">
                    {track.format}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 w-12 text-right">
                    {formatTime(track.duration)}
                  </span>

                  {onRenameTrack && (
                    <button
                      onClick={(e) => handleStartRename(track, e)}
                      aria-label="Rename song"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition"
                      title="Rename Song"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => onToggleFavorite(track.id)}
                    aria-label="Toggle favorite"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 transition"
                  >
                    <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => onOpenAddToPlaylist(track)}
                    aria-label="Add to playlist"
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition"
                    title="Add to Playlist"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>

                  {track.isCustom && onDeleteTrack && (
                    <button
                      onClick={() => onDeleteTrack(track.id)}
                      aria-label="Delete track"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition hidden sm:inline-flex"
                      title="Delete from Library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Track Rename Modal Dialog */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold">Rename Song</h3>
              </div>
              <button
                onClick={() => setEditingTrack(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Song Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. hetera by elvo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500/60"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Artist</label>
                <input
                  type="text"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  placeholder="e.g. elvo or Local Artist"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-600/30 transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Name</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
