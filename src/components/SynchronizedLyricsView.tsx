import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic2,
  RefreshCw,
  FileText,
  Upload,
  X,
  Plus,
  Minus,
  Disc3,
  Loader2,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { Track, LyricLine, TrackLyrics } from '../types/audio';
import { fetchTrackLyrics } from '../services/lyricsService';
import { parseLRC, getActiveLyricIndex, parseLrcFile } from '../utils/lrcParser';
import { formatTime } from '../utils/formatters';

interface SynchronizedLyricsViewProps {
  track: Track;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onClose?: () => void;
  compact?: boolean;
  onAttachLrc?: (trackId: string, file: File) => Promise<void>;
  onSaveLrcText?: (trackId: string, lrcText: string, fileName?: string) => Promise<void>;
  onUpdateOffset?: (trackId: string, offset: number) => void;
}

export const SynchronizedLyricsView: React.FC<SynchronizedLyricsViewProps> = ({
  track,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onClose,
  compact = false,
  onAttachLrc,
  onSaveLrcText,
  onUpdateOffset,
}) => {
  const [lyricsData, setLyricsData] = useState<TrackLyrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [offsetSeconds, setOffsetSeconds] = useState(track.lrcOffset || 0);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [customLrcInput, setCustomLrcInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDraggingLrc, setIsDraggingLrc] = useState(false);

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const lrcFileInputRef = useRef<HTMLInputElement | null>(null);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync initial offset when track changes
  useEffect(() => {
    setOffsetSeconds(track.lrcOffset || 0);
  }, [track.id, track.lrcOffset]);

  // Load lyrics when track changes: prioritize embedded / loaded .lrc metadata first
  useEffect(() => {
    let isMounted = true;
    setUserScrolled(false);

    const rawLrc = track.syncedLyrics || track.lrcContent;
    if (rawLrc) {
      const parsed = parseLRC(rawLrc);
      setLyricsData({
        trackId: track.id,
        syncedLyrics: rawLrc,
        plainLyrics: track.plainLyrics,
        parsedLines: parsed.lines,
        source: track.lrcFileName ? `LRC File (${track.lrcFileName})` : 'Synchronized LRC',
        isInstrumental: parsed.lines.length === 0,
      });
      setIsLoading(false);
      return;
    }

    // Otherwise fetch from LRCLIB service
    setIsLoading(true);
    async function loadLyrics() {
      try {
        const result = await fetchTrackLyrics(track);
        if (isMounted) {
          setLyricsData(result);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    }

    loadLyrics();

    return () => {
      isMounted = false;
      if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    };
  }, [track.id, track.title, track.artist, track.syncedLyrics, track.lrcContent, track.lrcFileName]);

  const lines = lyricsData?.parsedLines || [];

  // Active line index based on playback time & timing calibration offset
  const activeIndex = useMemo(() => {
    return getActiveLyricIndex(lines, currentTime, offsetSeconds);
  }, [lines, currentTime, offsetSeconds]);

  // Smooth auto-scroll following playback
  useEffect(() => {
    if (!userScrolled && activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, userScrolled]);

  const handleContainerScroll = () => {
    setUserScrolled(true);
    if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    // Auto resume following playback after 4.5 seconds of user inactivity
    userScrollTimeoutRef.current = setTimeout(() => {
      setUserScrolled(false);
    }, 4500);
  };

  const handleResumeAutoScroll = () => {
    setUserScrolled(false);
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  const handleOffsetChange = (delta: number) => {
    const next = +(offsetSeconds + delta).toFixed(1);
    setOffsetSeconds(next);
    if (onUpdateOffset) {
      onUpdateOffset(track.id, next);
    }
    setStatusMessage(`Timing offset set to ${next > 0 ? `+${next}s` : `${next}s`}`);
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleResetOffset = () => {
    setOffsetSeconds(0);
    if (onUpdateOffset) {
      onUpdateOffset(track.id, 0);
    }
    setStatusMessage('Timing offset reset to 0.0s');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  // Handle local .LRC file selection
  const handleLrcFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRes = await parseLrcFile(file);
      if (parsedRes.lines.length === 0) {
        setStatusMessage('No valid timestamped lines found in LRC file');
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }

      setLyricsData({
        trackId: track.id,
        syncedLyrics: parsedRes.rawText,
        parsedLines: parsedRes.lines,
        source: `File: ${file.name}`,
        isInstrumental: false,
      });

      if (onAttachLrc) {
        await onAttachLrc(track.id, file);
      } else if (onSaveLrcText) {
        await onSaveLrcText(track.id, parsedRes.rawText, file.name);
      }

      setStatusMessage(`Loaded ${parsedRes.lines.length} synchronized lines from "${file.name}"`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Error reading LRC file:', err);
      setStatusMessage('Failed to parse .LRC file');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      e.target.value = '';
    }
  };

  // Handle drag and drop of .LRC file directly onto the lyrics view
  const handleDropLrc = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLrc(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.lrc') && !file.name.toLowerCase().endsWith('.txt')) {
      setStatusMessage('Please drop a valid .lrc or .txt lyrics file');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    try {
      const parsedRes = await parseLrcFile(file);
      setLyricsData({
        trackId: track.id,
        syncedLyrics: parsedRes.rawText,
        parsedLines: parsedRes.lines,
        source: `Dropped: ${file.name}`,
        isInstrumental: false,
      });

      if (onAttachLrc) {
        await onAttachLrc(track.id, file);
      } else if (onSaveLrcText) {
        await onSaveLrcText(track.id, parsedRes.rawText, file.name);
      }

      setStatusMessage(`Imported ${parsedRes.lines.length} synced lines from "${file.name}"`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch {
      setStatusMessage('Could not parse dropped lyrics file');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Handle pasted LRC text
  const handleApplyCustomLrc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLrcInput.trim()) return;

    const parsedRes = parseLRC(customLrcInput);
    if (parsedRes.lines.length === 0) {
      setStatusMessage('No valid [mm:ss] timestamps found in text');
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }

    setLyricsData({
      trackId: track.id,
      syncedLyrics: customLrcInput,
      parsedLines: parsedRes.lines,
      source: 'Pasted LRC',
      isInstrumental: false,
    });

    if (onSaveLrcText) {
      await onSaveLrcText(track.id, customLrcInput, 'custom_pasted.lrc');
    }

    setShowPasteModal(false);
    setCustomLrcInput('');
    setStatusMessage(`Imported ${parsedRes.lines.length} synchronized lines`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRefreshFromNetwork = async () => {
    setIsLoading(true);
    setStatusMessage('Querying external metadata service...');
    try {
      const result = await fetchTrackLyrics(track);
      setLyricsData(result);
      setStatusMessage('Lyrics fetched from LRCLIB');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch {
      setStatusMessage('External service request error');
      setTimeout(() => setStatusMessage(null), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingLrc(true);
      }}
      onDragLeave={() => setIsDraggingLrc(false)}
      onDrop={handleDropLrc}
      className={`flex flex-col h-full w-full bg-[#0c0c0e]/95 backdrop-blur-2xl text-[#f2efeb] select-none animate-in fade-in duration-200 relative ${
        compact ? 'p-3' : 'p-4 sm:p-6'
      }`}
    >
      {/* Hidden LRC file picker */}
      <input
        ref={lrcFileInputRef}
        type="file"
        accept=".lrc,.txt,text/plain"
        className="hidden"
        onChange={handleLrcFileInput}
      />

      {/* Drag & Drop Overlay */}
      {isDraggingLrc && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-[#ff3e3e] rounded-2xl p-6 text-center animate-in fade-in duration-150">
          <Upload className="w-12 h-12 text-[#ff3e3e] mb-3 animate-bounce" />
          <h3 className="font-syne font-extrabold text-lg text-white">Drop .LRC File Here</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Attach synchronized lyrics to "{track.title}"
          </p>
        </div>
      )}

      {/* Top Controls Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.1] shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#ff3e3e]/15 text-[#ff3e3e] border border-[#ff3e3e]/30 shrink-0">
            <Mic2 className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-syne font-bold text-white truncate">
                Synchronized Lyrics
              </h2>
              {lyricsData?.source && (
                <span className="hidden xs:inline-block text-[10px] px-2 py-0.5 rounded-md bg-[#ff3e3e]/10 text-[#ff3e3e] border border-[#ff3e3e]/20 font-mono truncate max-w-[140px]">
                  {lyricsData.source}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
              {track.title} • {track.artist}
            </p>
          </div>
        </div>

        {/* Action Buttons & Timing Calibration */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Timing offset calibration (+/- 0.5s) */}
          <div
            className="flex items-center bg-white/[0.05] border border-white/[0.1] rounded-xl px-1.5 py-1 text-xs text-zinc-300"
            title="Calibrate timing offset if lyrics are early or late"
          >
            <button
              onClick={() => handleOffsetChange(-0.5)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.1] transition cursor-pointer"
              title="Earlier (-0.5s)"
              aria-label="Decrease sync offset"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetOffset}
              className="px-1.5 text-[11px] font-mono text-zinc-300 hover:text-white min-w-[36px] text-center cursor-pointer"
              title="Click to reset offset to 0.0s"
            >
              {offsetSeconds > 0 ? `+${offsetSeconds}s` : `${offsetSeconds}s`}
            </button>
            <button
              onClick={() => handleOffsetChange(0.5)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.1] transition cursor-pointer"
              title="Later (+0.5s)"
              aria-label="Increase sync offset"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Load .LRC File Button */}
          <button
            onClick={() => lrcFileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/[0.12] text-xs font-semibold transition active:scale-95 cursor-pointer"
            title="Load .LRC file from device"
            aria-label="Upload LRC File"
          >
            <Upload className="w-3.5 h-3.5 text-[#ff3e3e]" />
            <span className="hidden sm:inline">Load .LRC</span>
          </button>

          {/* Paste LRC */}
          <button
            onClick={() => setShowPasteModal(true)}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.1] transition active:scale-95 cursor-pointer"
            title="Paste custom LRC timestamps"
            aria-label="Paste lyrics"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Refresh from LRCLIB */}
          <button
            onClick={handleRefreshFromNetwork}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.1] transition active:scale-95 cursor-pointer"
            title="Fetch online lyrics from LRCLIB"
            aria-label="Refresh online lyrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#ff3e3e]' : ''}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.1] transition cursor-pointer"
              aria-label="Close lyrics view"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Status Notification */}
      {statusMessage && (
        <div className="mt-2 py-1.5 px-3 rounded-xl bg-red-950/80 border border-[#ff3e3e]/40 text-red-200 text-xs text-center font-medium animate-in fade-in duration-150 shadow-lg">
          {statusMessage}
        </div>
      )}

      {/* Synchronized Lyrics Scrolling Viewport */}
      <div
        ref={scrollContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto py-8 sm:py-10 px-2 sm:px-6 space-y-4 sm:space-y-5 scrollbar-thin scrollbar-thumb-zinc-800 text-center relative focus:outline-none"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff3e3e]" />
            <p className="text-xs">Fetching synchronized lyrics...</p>
          </div>
        ) : lines.length === 0 ? (
          /* Empty State: Prompt user to load or paste an LRC file */
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 shadow-inner">
              <Disc3 className="w-8 h-8 text-[#ff3e3e]/60" />
            </div>
            <div>
              <h3 className="text-base font-syne font-bold text-white">No Synchronized LRC Lyrics</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
                Load a <strong className="text-zinc-200">.lrc</strong> file from your device, drag & drop it here, or paste timestamps to enjoy real-time synced lyrics.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              <button
                onClick={() => lrcFileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff3e3e] to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select .LRC File</span>
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.1] font-semibold text-xs transition active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste LRC</span>
              </button>
            </div>
          </div>
        ) : (
          lines.map((line, idx) => {
            const isActive = idx === activeIndex;
            const isPast = idx < activeIndex;

            return (
              <div
                key={`${idx}-${line.time}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek(line.time)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSeek(line.time);
                  }
                }}
                className={`transition-all duration-300 cursor-pointer rounded-2xl py-2.5 px-4 group max-w-lg mx-auto ${
                  isActive
                    ? 'text-[#ff3e3e] font-syne font-extrabold text-2xl sm:text-3xl scale-105 drop-shadow-[0_0_24px_rgba(255,62,62,0.6)] bg-white/[0.06] border border-[#ff3e3e]/40 shadow-lg'
                    : isPast
                    ? 'text-zinc-400/80 hover:text-white text-base sm:text-lg font-medium opacity-70 hover:opacity-100'
                    : 'text-zinc-500 hover:text-zinc-300 text-base sm:text-lg font-medium opacity-50 hover:opacity-100'
                }`}
                title={`Jump to ${formatTime(line.time)}`}
              >
                <div className="flex items-center justify-center gap-2.5">
                  <span
                    className={`text-[10px] font-mono tracking-wider transition-opacity ${
                      isActive ? 'text-[#ff3e3e] opacity-80' : 'text-zinc-500 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {formatTime(line.time)}
                  </span>
                  <span>{line.text}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating "Sync with Playback" Pill when user has manually scrolled */}
      {userScrolled && lines.length > 0 && (
        <div className="sticky bottom-2 flex justify-center pb-2 z-20 animate-in fade-in slide-in-from-bottom duration-200">
          <button
            onClick={handleResumeAutoScroll}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff3e3e] hover:bg-red-500 text-white text-xs font-bold shadow-xl shadow-red-600/40 transition active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            <span>Sync to Playback</span>
          </button>
        </div>
      )}

      {/* Paste Custom LRC Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-5 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ff3e3e]" />
                <h3 className="text-sm font-bold">Paste Synchronized LRC Text</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
                aria-label="Close paste modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustomLrc} className="mt-4 space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Paste lines with standard LRC timestamps like <code className="text-[#ff3e3e] bg-white/[0.05] px-1 py-0.5 rounded">[00:12.50] Lyric line</code>.
              </p>
              <textarea
                rows={8}
                value={customLrcInput}
                onChange={(e) => setCustomLrcInput(e.target.value)}
                placeholder="[00:00.80] First verse begins here&#10;[00:04.50] Next line synced with audio&#10;[00:08.20] Heavy chorus drops"
                className="w-full p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[#ff3e3e]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#ff3e3e] hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition active:scale-95 cursor-pointer"
                >
                  Apply Lyrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
