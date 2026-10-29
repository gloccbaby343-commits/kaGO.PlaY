import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  Sliders,
  ListPlus,
  Info,
  Radio,
  Trash2,
  Zap,
  Mic2,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { RepeatMode, Track } from '../types/audio';
import { formatFileSize, formatTime } from '../utils/formatters';
import { VisualizerCanvas } from './VisualizerCanvas';
import { SynchronizedLyricsView } from './SynchronizedLyricsView';

import defaultCoverImage from '../assets/images/kago_default_cover_1793108092140.jpg';

const DEFAULT_COVER_IMAGE = defaultCoverImage;

interface FullscreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: Track[];
  queueIndex: number;
  isFavorite: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  onToggleFavorite: () => void;
  onOpenEQ: () => void;
  onOpenAddToPlaylist: () => void;
  onSelectQueueTrack: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  bassBoostEnabled?: boolean;
  onToggleBassBoost?: () => void;
  initialView?: 'turntable' | 'lyrics' | 'queue' | 'info';
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  repeatMode,
  isShuffle,
  queue,
  queueIndex,
  isFavorite,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleRepeat,
  onToggleShuffle,
  onToggleFavorite,
  onOpenEQ,
  onOpenAddToPlaylist,
  onSelectQueueTrack,
  onRemoveFromQueue,
  bassBoostEnabled = false,
  onToggleBassBoost,
  initialView = 'turntable',
}) => {
  const [activeView, setActiveView] = useState<'turntable' | 'lyrics' | 'queue' | 'info'>(initialView);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave'>('bars');

  React.useEffect(() => {
    if (isOpen && initialView) {
      setActiveView(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen || !currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remainingTime = Math.max(0, duration - currentTime);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0c0c0e] text-[#f2efeb] overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
      {/* Dynamic Background Glow from current track's gradient */}
      <div className="absolute inset-0 pointer-events-none opacity-20 blur-3xl overflow-hidden">
        <div className={`w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-tr ${currentTrack.coverGradient} absolute top-1/4 left-1/2 -translate-x-1/2`} />
      </div>

      {/* Top App Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-[#f2efeb]/15">
        <button
          onClick={onClose}
          aria-label="Minimize player"
          className="p-2 rounded-sm text-[#f2efeb]/60 hover:text-white hover:bg-[#16161a] transition active:scale-95 cursor-pointer"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="label !text-[#ff3e3e] !opacity-100">
            Now Playing
          </span>
          <p className="font-syne text-xs text-[#f2efeb]/80 truncate max-w-[160px] sm:max-w-xs mt-0.5">
            {currentTrack.album}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {/* Synchronized Lyrics Toggle */}
          <button
            onClick={() => setActiveView(activeView === 'lyrics' ? 'turntable' : 'lyrics')}
            className={`p-2 rounded-sm transition cursor-pointer ${
              activeView === 'lyrics'
                ? 'text-[#ff3e3e] bg-[#ff3e3e]/15 border border-[#ff3e3e]/40'
                : 'text-[#f2efeb]/60 hover:text-white hover:bg-[#16161a]'
            }`}
            title="Synchronized Lyrics"
            aria-label="Toggle Synchronized Lyrics"
          >
            <Mic2 className="w-5 h-5" />
          </button>

          {/* Track Info */}
          <button
            onClick={() => setActiveView(activeView === 'info' ? 'turntable' : 'info')}
            className={`p-2 rounded-xl transition ${
              activeView === 'info' ? 'text-red-500 bg-red-500/15 border border-red-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title="Track Info"
            aria-label="Track details"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Equalizer */}
          <button
            onClick={onOpenEQ}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            title="5-Band Equalizer"
            aria-label="Open Equalizer"
          >
            <Sliders className="w-5 h-5" />
          </button>

          {/* Queue */}
          <button
            onClick={() => setActiveView(activeView === 'queue' ? 'turntable' : 'queue')}
            className={`p-2 rounded-xl transition ${
              activeView === 'queue' ? 'text-red-500 bg-red-500/15 border border-red-500/30' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title="Playback Queue"
            aria-label="Toggle Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Body */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-2 overflow-y-auto max-w-lg mx-auto w-full min-h-0">
        {activeView === 'lyrics' ? (
          <div className="w-full flex-1 flex flex-col min-h-[320px] sm:min-h-[380px] my-1">
            <SynchronizedLyricsView
              track={currentTrack}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onSeek={onSeek}
              onClose={() => setActiveView('turntable')}
            />
          </div>
        ) : (
          /* Vinyl Record / Album Artwork with Spinning Animation */
          <div className="relative my-auto flex flex-col items-center justify-center">
            <div
              className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full p-2.5 bg-gradient-to-tr ${
                currentTrack.coverGradient
              } shadow-2xl relative flex items-center justify-center transition-transform duration-500 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              {/* Vinyl record grooves rings */}
              <div className="absolute inset-4 rounded-full border border-black/30" />
              <div className="absolute inset-8 rounded-full border border-black/30" />
              <div className="absolute inset-12 rounded-full border border-black/30" />

              {/* Inner Center Label / Cover Art */}
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-zinc-950 shadow-inner relative flex items-center justify-center bg-black">
                <img
                  src={currentTrack.coverArtUrl || DEFAULT_COVER_IMAGE}
                  alt={currentTrack.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {/* Spindle hole */}
                <div className="absolute w-5 h-5 rounded-full bg-black border-2 border-zinc-800" />
              </div>
            </div>

            {/* Visualizer Canvas Mode Switcher & Display */}
            <div className="w-full mt-4 flex flex-col items-center">
              <div className="w-full max-w-xs h-14">
                <VisualizerCanvas isPlaying={isPlaying} mode={visualizerMode} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setVisualizerMode('bars')}
                  className={`text-[10px] px-2.5 py-0.5 rounded font-mono uppercase transition ${
                    visualizerMode === 'bars' ? 'bg-red-600 text-white font-bold shadow-sm shadow-red-600/30' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-950 border border-zinc-900'
                  }`}
                >
                  Spectrum
                </button>
                <button
                  onClick={() => setVisualizerMode('wave')}
                  className={`text-[10px] px-2.5 py-0.5 rounded font-mono uppercase transition ${
                    visualizerMode === 'wave' ? 'bg-red-600 text-white font-bold shadow-sm shadow-red-600/30' : 'text-zinc-500 hover:text-zinc-300 bg-zinc-950 border border-zinc-900'
                  }`}
                >
                  Waveform
                </button>
              </div>

              {/* Quick Lyrics Access Button */}
              <button
                onClick={() => setActiveView('lyrics')}
                className="label flex items-center gap-1.5 px-3.5 py-1.5 mt-3 border border-[#ff3e3e]/40 hover:border-[#ff3e3e] text-[#ff3e3e] !opacity-100 transition active:scale-95 cursor-pointer rounded-sm"
                title="Open Synchronized Lyrics"
              >
                <Mic2 className="w-3.5 h-3.5 text-[#ff3e3e]" />
                <span>Synchronized Lyrics</span>
              </button>
            </div>
          </div>
        )}

        {/* Track Info & Action Badges */}
        <div className="w-full mt-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-syne text-xl sm:text-2xl font-extrabold text-[#f2efeb] truncate">
                {currentTrack.title}
              </h1>
              <p className="text-sm sm:text-base text-[#f2efeb]/70 font-medium truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onOpenAddToPlaylist}
                className="p-2 text-[#f2efeb]/60 hover:text-[#ff3e3e] transition cursor-pointer"
                title="Add to playlist"
                aria-label="Add track to playlist"
              >
                <ListPlus className="w-5 h-5" />
              </button>
              <button
                onClick={onToggleFavorite}
                className="p-2 text-[#f2efeb]/60 hover:text-[#ff3e3e] transition cursor-pointer"
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? 'fill-[#ff3e3e] text-[#ff3e3e]' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Scrub Bar */}
        <div className="w-full mt-4">
          <div className="relative group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#f2efeb]/15 rounded-sm appearance-none cursor-pointer accent-[#ff3e3e]"
              aria-label="Seek track position"
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-[#f2efeb]/60 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span className="text-[11px] opacity-40">-{formatTime(remainingTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls Row */}
        <div className="w-full mt-4 flex items-center justify-between">
          <button
            onClick={onToggleShuffle}
            aria-label={`Shuffle ${isShuffle ? 'on' : 'off'}`}
            className={`p-3 rounded-xl transition cursor-pointer ${
              isShuffle ? 'text-[#ff3e3e] bg-[#ff3e3e]/15 border border-[#ff3e3e]/40' : 'text-[#f2efeb]/60 hover:text-white hover:bg-white/[0.05]'
            }`}
            title="Toggle Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* 10s Backward */}
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 10))}
            aria-label="Rewind 10 seconds"
            className="p-2.5 text-[#f2efeb]/70 hover:text-[#ff3e3e] hover:bg-white/[0.06] rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center relative group/r10"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 group-hover/r10:text-[#ff3e3e]" />
            <span className="text-[8px] font-bold absolute inset-0 flex items-center justify-center pt-0.5 pointer-events-none group-hover/r10:text-[#ff3e3e]">10</span>
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrevious}
            aria-label="Previous track"
            className="p-3 text-[#f2efeb]/80 hover:text-white hover:bg-white/[0.05] rounded-xl transition active:scale-95 cursor-pointer"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onTogglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-16 h-16 rounded-full bg-[#ff3e3e] hover:bg-[#e03030] text-[#0c0c0e] shadow-xl shadow-[#ff3e3e]/30 active:scale-95 transition cursor-pointer flex items-center justify-center shrink-0 border-none"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNext}
            aria-label="Next track"
            className="p-3 text-[#f2efeb]/80 hover:text-white hover:bg-white/[0.05] rounded-xl transition active:scale-95 cursor-pointer"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          {/* 10s Forward */}
          <button
            onClick={() => onSeek(Math.min(duration || Infinity, currentTime + 10))}
            aria-label="Forward 10 seconds"
            className="p-2.5 text-[#f2efeb]/70 hover:text-[#ff3e3e] hover:bg-white/[0.06] rounded-full transition active:scale-95 cursor-pointer flex items-center justify-center relative group/f10"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 group-hover/f10:text-[#ff3e3e]" />
            <span className="text-[8px] font-bold absolute inset-0 flex items-center justify-center pt-0.5 pointer-events-none group-hover/f10:text-[#ff3e3e]">10</span>
          </button>

          {/* Repeat Mode */}
          <button
            onClick={onToggleRepeat}
            aria-label={`Repeat mode: ${repeatMode}`}
            className={`p-3 rounded-xl transition cursor-pointer ${
              repeatMode !== 'off' ? 'text-red-500 bg-red-500/15 border border-red-500/30' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume & Codec Row */}
        <div className="w-full mt-5 flex items-center gap-3 px-2">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="text-zinc-400 hover:text-white transition"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-900 rounded-lg cursor-pointer accent-red-600"
            aria-label="Volume slider"
          />
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 font-bold uppercase shrink-0 border border-zinc-800">
            {currentTrack.format}
          </span>
        </div>

        {/* Quick Bass Boost Toggle & EQ Row */}
        <div className="w-full mt-4 flex items-center justify-between gap-2 px-2 pt-3 border-t border-zinc-900">
          <button
            onClick={onToggleBassBoost}
            aria-label={`Toggle bass boost ${bassBoostEnabled ? 'off' : 'on'}`}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
              bassBoostEnabled
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 border border-red-500'
                : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${bassBoostEnabled ? 'fill-current text-white' : 'text-zinc-400'}`} />
            <span>Bass Boost: {bassBoostEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onOpenEQ}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-950 hover:bg-zinc-900 text-red-400 hover:text-red-300 border border-zinc-900 transition active:scale-95"
            title="Open Equalizer Presets & Bands"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Equalizer & Presets</span>
          </button>
        </div>
      </div>

      {/* Slide-over Queue Drawer */}
      {activeView === 'queue' && (
        <div className="absolute inset-x-0 bottom-0 top-16 z-30 bg-black/98 backdrop-blur-2xl border-t border-zinc-900 p-5 flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-sm text-zinc-100">Up Next in Queue ({queue.length})</h3>
            </div>
            <button
              onClick={() => setActiveView('turntable')}
              className="text-xs text-red-400 hover:underline font-bold"
            >
              Done
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 divide-y divide-zinc-900">
            {queue.map((track, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition ${
                    isCurrent ? 'bg-red-600/20 text-red-300 border border-red-950/60' : 'hover:bg-zinc-900/50'
                  }`}
                >
                  <div
                    onClick={() => onSelectQueueTrack(idx)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="text-xs font-mono font-bold w-5 text-zinc-500">
                      {isCurrent ? '▶' : idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-red-200 font-bold' : 'text-zinc-200'}`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-mono text-zinc-500">{formatTime(track.duration)}</span>
                    {queue.length > 1 && (
                      <button
                        onClick={() => onRemoveFromQueue(idx)}
                        aria-label={`Remove ${track.title} from queue`}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-over Info Drawer */}
      {activeView === 'info' && (
        <div className="absolute inset-x-0 bottom-0 top-16 z-30 bg-black/98 backdrop-blur-2xl border-t border-zinc-900 p-6 flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <h3 className="font-bold text-sm text-zinc-100">Audio Track Properties</h3>
            <button onClick={() => setActiveView('turntable')} className="text-xs text-red-400 hover:underline font-bold">
              Close
            </button>
          </div>
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-zinc-900">
              <span className="text-zinc-400">File Name</span>
              <span className="text-zinc-200 font-mono text-[11px] truncate max-w-xs">{currentTrack.fileName || `${currentTrack.title}.${currentTrack.format}`}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-900">
              <span className="text-zinc-400">Codec / Container</span>
              <span className="text-red-400 font-bold uppercase">{currentTrack.format}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-900">
              <span className="text-zinc-400">Duration</span>
              <span className="text-zinc-200 font-mono">{formatTime(currentTrack.duration)} ({Math.round(currentTrack.duration)}s)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-900">
              <span className="text-zinc-400">File Size</span>
              <span className="text-zinc-200">{formatFileSize(currentTrack.fileSize)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-zinc-900">
              <span className="text-zinc-400">Storage Location</span>
              <span className="text-red-400 font-medium">{currentTrack.isCustom ? 'Device Storage / Offline' : 'Procedural Studio Demo'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

