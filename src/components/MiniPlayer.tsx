import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, ChevronUp, Sliders, Mic2, RotateCcw, RotateCw } from 'lucide-react';
import { Track } from '../types/audio';
import { formatTime } from '../utils/formatters';
import { VisualizerCanvas } from './VisualizerCanvas';

import defaultCoverImage from '../assets/images/kago_default_cover_1793108092140.jpg';

const DEFAULT_COVER_IMAGE = defaultCoverImage;

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isFavorite: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeekBackward10?: () => void;
  onSeekForward10?: () => void;
  onToggleFavorite: () => void;
  onExpand: () => void;
  onOpenLyrics?: () => void;
  onOpenEQ: () => void;
  onSeek: (time: number) => void;
  queueLength?: number;
  engineMode?: string;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  isFavorite,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeekBackward10,
  onSeekForward10,
  onToggleFavorite,
  onExpand,
  onOpenLyrics,
  onOpenEQ,
  onSeek,
  queueLength,
  engineMode,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <footer className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-40 bg-black/65 backdrop-blur-2xl border-t border-white/[0.12] shadow-[0_-10px_35px_rgba(0,0,0,0.5)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-col md:grid md:grid-cols-[280px_1fr_240px] items-center gap-3">
        {/* Left: Now Playing */}
        <div
          onClick={onExpand}
          className="flex items-center gap-3 w-full md:w-auto cursor-pointer group min-w-0"
        >
          <div
            className={`w-12 h-12 bg-[#16161a] border border-[#f2efeb]/20 relative flex items-center justify-center shrink-0 overflow-hidden rounded-sm group/thumb ${
              isPlaying ? 'animate-spin-slow ring-1 ring-[#ff3e3e]/50' : ''
            }`}
          >
            <img
              src={currentTrack.coverArtUrl || DEFAULT_COVER_IMAGE}
              alt=""
              onError={(e) => {
                e.currentTarget.src = DEFAULT_COVER_IMAGE;
              }}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-300 ease-out hover:scale-105 group-hover:scale-105 border-0 cursor-pointer"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none flex items-end justify-center pb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff3e3e] shadow-[0_0_8px_#ff3e3e]" />
              </div>
            )}
          </div>

          <div className="min-w-0 pr-2">
            <h4 className="font-syne font-bold text-xs sm:text-sm text-[#f2efeb] truncate group-hover:text-[#ff3e3e] transition">
              {currentTrack.title}
            </h4>
            <div className="label text-[10px] mt-0.5 truncate">
              {formatTime(currentTime)} / {formatTime(duration)} • {currentTrack.format.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Center: Controls & Slim Progress Bar */}
        <div className="flex flex-col items-center gap-2 w-full max-w-md">
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* 10 Seconds Backward */}
            <button
              onClick={onSeekBackward10 || (() => onSeek(Math.max(0, currentTime - 10)))}
              aria-label="Rewind 10 seconds"
              title="Rewind 10 seconds"
              className="p-1.5 text-[#f2efeb]/70 hover:text-[#ff3e3e] hover:bg-white/[0.08] rounded-full transition cursor-pointer flex items-center justify-center relative active:scale-95 group/r10"
            >
              <RotateCcw className="w-4 h-4 group-hover/r10:text-[#ff3e3e]" />
              <span className="text-[7px] font-bold absolute inset-0 flex items-center justify-center pt-0.5 pointer-events-none group-hover/r10:text-[#ff3e3e]">10</span>
            </button>

            {/* Previous Track */}
            <button
              onClick={onPrevious}
              aria-label="Previous track"
              className="label hover:!opacity-100 cursor-pointer flex items-center gap-1 transition p-1 hover:bg-white/[0.05] rounded-lg"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">PREV</span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#ff3e3e] hover:bg-[#e03030] text-[#0c0c0e] border-none flex items-center justify-center cursor-pointer shadow-lg shadow-[#ff3e3e]/30 active:scale-95 transition shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={onNext}
              aria-label="Next track"
              className="label hover:!opacity-100 cursor-pointer flex items-center gap-1 transition p-1 hover:bg-white/[0.05] rounded-lg"
            >
              <span className="hidden xs:inline">NEXT</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* 10 Seconds Forward */}
            <button
              onClick={onSeekForward10 || (() => onSeek(Math.min(duration || Infinity, currentTime + 10)))}
              aria-label="Forward 10 seconds"
              title="Forward 10 seconds"
              className="p-1.5 text-[#f2efeb]/70 hover:text-[#ff3e3e] hover:bg-white/[0.08] rounded-full transition cursor-pointer flex items-center justify-center relative active:scale-95 group/f10"
            >
              <RotateCw className="w-4 h-4 group-hover/f10:text-[#ff3e3e]" />
              <span className="text-[7px] font-bold absolute inset-0 flex items-center justify-center pt-0.5 pointer-events-none group-hover/f10:text-[#ff3e3e]">10</span>
            </button>

            {onOpenLyrics && (
              <button
                onClick={onOpenLyrics}
                aria-label="Lyrics"
                className="p-1.5 text-[#f2efeb]/60 hover:text-[#ff3e3e] hover:bg-white/[0.06] rounded-full transition cursor-pointer"
                title="Synchronized Lyrics"
              >
                <Mic2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onToggleFavorite}
              aria-label="Favorite"
              className="p-1.5 text-[#f2efeb]/60 hover:text-[#ff3e3e] hover:bg-white/[0.06] rounded-full transition cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#ff3e3e] text-[#ff3e3e]' : ''}`} />
            </button>

            <button
              onClick={onOpenEQ}
              aria-label="EQ"
              className="hidden sm:inline-flex p-1.5 text-[#f2efeb]/60 hover:text-[#f2efeb] hover:bg-white/[0.06] rounded-full transition cursor-pointer"
              title="EQ Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Audio Visualizer Spectrum */}
          <div className="w-full h-3.5 px-1 flex items-center justify-center overflow-hidden opacity-90">
            <VisualizerCanvas
              isPlaying={isPlaying}
              mode="bars"
              barCount={28}
              className="w-full h-full"
            />
          </div>

          {/* Progress Container */}
          <div
            className="w-full h-1 bg-[#f2efeb]/10 cursor-pointer relative group rounded-xs"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              onSeek(clickPos * duration);
            }}
            title="Seek position"
          >
            <div
              className="h-full bg-[#ff3e3e] transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Right: Stat Group from Variation 2 */}
        <div className="hidden md:flex items-center gap-5 justify-end w-full">
          <div className="stat-item text-right">
            <span className="label block text-[9px]">Songs</span>
            <span className="font-syne text-xs font-bold text-[#f2efeb]">
              {String(queueLength ?? 4).padStart(2, '0')}
            </span>
          </div>
          <div className="stat-item text-right">
            <span className="label block text-[9px]">Engine</span>
            <span className="font-syne text-xs font-bold text-[#ff3e3e]">
              {engineMode || 'NATIVE'}
            </span>
          </div>
          <button
            onClick={onExpand}
            aria-label="Expand player to fullscreen"
            className="p-1.5 text-[#f2efeb]/60 hover:text-[#f2efeb] transition cursor-pointer"
            title="Expand Full Player"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
