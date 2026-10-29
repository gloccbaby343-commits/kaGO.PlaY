import React, { useState } from 'react';
import { Disc3, Play, ChevronLeft, Clock, Music2 } from 'lucide-react';
import { Track } from '../types/audio';
import { groupTracksByAlbum } from '../utils/playlistUtils';
import { formatTime } from '../utils/formatters';

interface AlbumsViewProps {
  tracks: Track[];
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
}

export const AlbumsView: React.FC<AlbumsViewProps> = ({ tracks, onPlayTrack }) => {
  const [selectedAlbum, setSelectedAlbum] = useState<{
    album: string;
    artist: string;
    tracks: Track[];
    coverGradient: string;
    coverArtUrl?: string;
  } | null>(null);

  const albums = groupTracksByAlbum(tracks);

  if (selectedAlbum) {
    const totalDuration = selectedAlbum.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    return (
      <div className="space-y-6 animate-in fade-in duration-200 p-6 sm:p-10">
        <button
          onClick={() => setSelectedAlbum(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Albums</span>
        </button>

        {/* Album Header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 p-6 rounded-3xl bg-zinc-950/80 border border-red-950/80 shadow-xl shadow-red-950/20">
          <div
            className={`w-36 h-36 rounded-2xl bg-gradient-to-br ${selectedAlbum.coverGradient} flex items-center justify-center shrink-0 shadow-xl overflow-hidden`}
          >
            {selectedAlbum.coverArtUrl ? (
              <img src={selectedAlbum.coverArtUrl} alt={selectedAlbum.album} className="w-full h-full object-cover" />
            ) : (
              <Disc3 className="w-16 h-16 text-white/80" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono uppercase text-red-400 font-bold">Album</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate mt-1">
              {selectedAlbum.album}
            </h1>
            <p className="text-sm text-zinc-300 mt-1 font-medium">{selectedAlbum.artist}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-zinc-400 font-mono">
              <span>{selectedAlbum.tracks.length} songs</span>
              <span>•</span>
              <span>{formatTime(totalDuration)} total</span>
            </div>
            <button
              onClick={() => onPlayTrack(selectedAlbum.tracks[0], selectedAlbum.tracks)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Album</span>
            </button>
          </div>
        </div>

        {/* Tracks Table */}
        <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-900 bg-black/60">
          {selectedAlbum.tracks.map((track, idx) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track, selectedAlbum.tracks)}
              className="flex items-center justify-between p-3 sm:px-4 hover:bg-zinc-950/80 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-mono font-bold text-zinc-500 group-hover:text-red-400">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-zinc-400">{formatTime(track.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 p-6 sm:p-10">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-red-500" />
          <span>Albums</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
            {albums.length}
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">Organized by local album metadata</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {albums.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedAlbum(item)}
            className="p-3 rounded-2xl bg-zinc-950/80 hover:bg-black border border-zinc-900 hover:border-zinc-800 transition cursor-pointer group flex flex-col"
          >
            <div
              className={`aspect-square w-full rounded-xl bg-gradient-to-br ${item.coverGradient} relative flex items-center justify-center overflow-hidden mb-3 shadow-md`}
            >
              {item.coverArtUrl ? (
                <img src={item.coverArtUrl} alt={item.album} className="w-full h-full object-cover" />
              ) : (
                <Disc3 className="w-12 h-12 text-white/70 group-hover:scale-110 transition-transform" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>
            <h3 className="text-xs font-bold text-zinc-200 truncate group-hover:text-red-400 transition">
              {item.album}
            </h3>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{item.artist}</p>
            <span className="text-[10px] text-zinc-500 font-mono mt-1">{item.tracks.length} songs</span>
          </div>
        ))}
      </div>
    </div>
  );
};
