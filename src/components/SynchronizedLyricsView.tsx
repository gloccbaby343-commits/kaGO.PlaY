import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic2,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
  Volume2,
  FileText,
  SlidersHorizontal,
  X,
  ExternalLink,
  Plus,
  Minus,
  Check,
  Disc3,
  Loader2,
} from 'lucide-react';
import { Track, LyricLine, TrackLyrics } from '../types/audio';
import { fetchTrackLyrics, getActiveLyricIndex, parseLRC } from '../services/lyricsService';
import { formatTime } from '../utils/formatters';

interface SynchronizedLyricsViewProps {
  track: Track;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onClose?: () => void;
  compact?: boolean;
}

export const SynchronizedLyricsView: React.FC<SynchronizedLyricsViewProps> = ({
  track,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onClose,
  compact = false,
}) => {
  const [lyricsData, setLyricsData] = useState<TrackLyrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [offsetSeconds, setOffsetSeconds] = useState(0); // timing offset calibration in seconds
  const [userScrolled, setUserScrolled] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [customLrcInput, setCustomLrcInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const userScrollTimeoutRef = useRef<any>(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setOffsetSeconds(0);
    setUserScrolled(false);

    async function loadLyrics() {
      try {
        const result = await fetchTrackLyrics(track);
        if (isMounted) {
          setLyricsData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLyrics();

    return () => {
      isMounted = false;
      if (userScrollTimeoutRef.current) clearTimeout(userScrollTimeoutRef.current);
    };
  }, [track.id, track.title, track.artist]);

  const lines = lyricsData?.parsedLines || [];
  const activeIndex = useMemo(() => {
    return getActiveLyricIndex(lines, currentTime, offsetSeconds);
  }, [lines, currentTime, offsetSeconds]);

  // Smooth auto-scroll to keep active lyric in center view unless user manually scrolled
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
    // Auto resume following playback after 4 seconds of inactivity
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

  const handleRefresh = async () => {
    setIsLoading(true);
    setStatusMessage('Querying external metadata service...');
    try {
      const result = await fetchTrackLyrics(track);
      setLyricsData(result);
      setStatusMessage('Lyrics refreshed from LRCLIB');
      setTimeout(() => setStatusMessage(null), 2500);
    } catch {
      setStatusMessage('External service request error');
      setTimeout(() => setStatusMessage(null), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCustomLrc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLrcInput.trim()) return;

    const parsed = parseLRC(customLrcInput);
    if (parsed.length === 0) {
      setStatusMessage('No valid timestamps found in input');
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }

    setLyricsData({
      trackId: track.id,
      syncedLyrics: customLrcInput,
      parsedLines: parsed,
      source: 'User Provided LRC Data',
      isInstrumental: false,
    });

    setShowPasteModal(false);
    setCustomLrcInput('');
    setStatusMessage(`Imported ${parsed.length} synchronized lines`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  return (
    <div className={`flex flex-col h-full w-full bg-[#0c0c0e] text-[#f2efeb] select-none animate-in fade-in duration-200 ${compact ? 'p-3' : 'p-4 sm:p-6'}`}>
      {/* Top Controls Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#f2efeb]/15 shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-sm bg-[#ff3e3e]/15 text-[#ff3e3e] border border-[#ff3e3e]/30 shrink-0">
            <Mic2 className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-syne font-bold text-[#f2efeb] truncate">
                Synchronized Lyrics
              </h2>
              {lyricsData?.source && (
                <span className="hidden xs:inline text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono truncate">
                  {lyricsData.source.split(' ')[0]}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 truncate">
              {track.title} • {track.artist}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Timing offset calibration (+/- 0.5s) */}
          <div className="flex items-center bg-zinc-950 border border-zinc-900 rounded-xl px-1.5 py-1 text-xs text-zinc-300">
            <button
              onClick={() => setOffsetSeconds((prev) => +(prev - 0.5).toFixed(1))}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-900"
              title="Sync earlier (-0.5s)"
              aria-label="Decrease sync offset"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-zinc-400 min-w-[38px] text-center">
              {offsetSeconds > 0 ? `+${offsetSeconds}s` : `${offsetSeconds}s`}
            </span>
            <button
              onClick={() => setOffsetSeconds((prev) => +(prev + 0.5).toFixed(1))}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-900"
              title="Sync later (+0.5s)"
              aria-label="Increase sync offset"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Refresh Lyrics */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900 transition active:scale-95"
            title="Refresh lyrics from metadata service"
            aria-label="Refresh lyrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-red-500' : ''}`} />
          </button>

          {/* Custom Paste Modal */}
          <button
            onClick={() => setShowPasteModal(true)}
            className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900 transition active:scale-95"
            title="Paste custom LRC timestamps"
            aria-label="Paste lyrics"
          >
            <FileText className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-900 transition"
              aria-label="Close lyrics view"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Status or Toast */}
      {statusMessage && (
        <div className="mt-2 py-1.5 px-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs text-center font-medium animate-in fade-in duration-150">
          {statusMessage}
        </div>
      )}

      {/* Lyrics Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto py-12 px-2 sm:px-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800 text-center relative"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-xs">Fetching synchronized lyrics from external service...</p>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-500">
              <Disc3 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">No Synchronized Lyrics Found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                This track might be instrumental, or not yet indexed in LRCLIB. You can paste custom LRC timestamps below.
              </p>
            </div>
            <button
              onClick={() => setShowPasteModal(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-md shadow-red-600/30 transition active:scale-95"
            >
              Paste Custom LRC Lyrics
            </button>
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
                className={`transition-all duration-300 cursor-pointer rounded-sm py-2 px-4 group ${
                  isActive
                    ? 'text-[#ff3e3e] font-syne font-extrabold text-xl sm:text-2xl scale-105 drop-shadow-[0_0_16px_rgba(255,62,62,0.4)] bg-[#16161a] border border-[#ff3e3e]/30'
                    : isPast
                    ? 'text-[#f2efeb]/40 hover:text-[#f2efeb] text-sm sm:text-base font-normal'
                    : 'text-[#f2efeb]/30 hover:text-[#f2efeb] text-sm sm:text-base font-normal'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span
                    className={`text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? 'text-[#ff3e3e] opacity-70' : 'text-[#f2efeb]/40'
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

      {/* Floating Resume Auto-Scroll Button */}
      {userScrolled && lines.length > 0 && (
        <div className="sticky bottom-2 flex justify-center pb-2 z-20 animate-in fade-in slide-in-from-bottom duration-200">
          <button
            onClick={handleResumeAutoScroll}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/40 transition active:scale-95"
          >
            <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            <span>Sync to Playback</span>
          </button>
        </div>
      )}

      {/* Paste Custom LRC Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-black border border-zinc-900 shadow-2xl p-5 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold">Paste Synchronized LRC Text</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white"
                aria-label="Close paste modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCustomLrc} className="mt-4 space-y-3">
              <p className="text-xs text-zinc-400">
                Paste timestamped LRC format (e.g. <code className="text-red-400">[00:12.50] Lyric line</code>). All lines will be sanitized to English automatically.
              </p>
              <textarea
                rows={8}
                value={customLrcInput}
                onChange={(e) => setCustomLrcInput(e.target.value)}
                placeholder="[00:04.00] First line of the song&#10;[00:08.50] Second line follows here&#10;[00:14.20] Chorus drops with heavy bass"
                className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition active:scale-95"
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
