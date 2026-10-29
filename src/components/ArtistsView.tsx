import React, { useState } from 'react';
import { Users2, Play, ChevronLeft, Music2 } from 'lucide-react';
import { Track } from '../types/audio';
import { groupTracksByArtist } from '../utils/playlistUtils';
import { formatTime } from '../utils/formatters';

interface ArtistsViewProps {
  tracks: Track[];
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
}

export const ArtistsView: React.FC<ArtistsViewProps> = ({ tracks, onPlayTrack }) => {
  const [selectedArtist, setSelectedArtist] = useState<{
    artist: string;
    tracks: Track[];
    albumCount: number;
    coverGradient: string;
  } | null>(null);

  const artists = groupTracksByArtist(tracks);

  if (selectedArtist) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200 p-6 sm:p-10">
        <button
          onClick={() => setSelectedArtist(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Artists</span>
        </button>

        {/* Artist Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-3xl bg-zinc-950 border border-zinc-900 shadow-xl">
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-br ${selectedArtist.coverGradient} flex items-center justify-center shrink-0 shadow-xl overflow-hidden`}
          >
            <Users2 className="w-14 h-14 text-white/80" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono uppercase text-red-500 font-bold">Artist</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate mt-1">
              {selectedArtist.artist}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              {selectedArtist.tracks.length} tracks • {selectedArtist.albumCount} album{selectedArtist.albumCount !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => onPlayTrack(selectedArtist.tracks[0], selectedArtist.tracks)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All by {selectedArtist.artist}</span>
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-900 bg-black">
          {selectedArtist.tracks.map((track, idx) => (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track, selectedArtist.tracks)}
              className="flex items-center justify-between p-3 sm:px-4 hover:bg-zinc-900/50 transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-mono font-bold text-zinc-500 group-hover:text-red-400">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                    {track.title}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">{track.album}</p>
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
          <Users2 className="w-5 h-5 text-red-500" />
          <span>Artists</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
            {artists.length}
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">Artists scanned from audio metadata</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {artists.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedArtist(item)}
            className="p-4 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 transition cursor-pointer group flex flex-col items-center text-center"
          >
            <div
              className={`w-28 h-28 rounded-full bg-gradient-to-br ${item.coverGradient} relative flex items-center justify-center overflow-hidden mb-3 shadow-lg group-hover:scale-105 transition-transform`}
            >
              <Users2 className="w-12 h-12 text-white/80" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>
            <h3 className="text-xs font-bold text-zinc-200 truncate w-full group-hover:text-red-400 transition">
              {item.artist}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
              {item.tracks.length} song{item.tracks.length !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
