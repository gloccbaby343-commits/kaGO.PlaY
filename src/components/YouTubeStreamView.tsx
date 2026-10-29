import React, { useState, useEffect } from 'react';
import {
  Search,
  Play,
  Plus,
  Heart,
  ListPlus,
  Flame,
  Radio,
  ExternalLink,
  Music,
  Sparkles,
  Loader2,
  Check,
  Link2,
} from 'lucide-react';
import { Track, YouTubeSearchResult } from '../types/audio';
import { generateCoverGradient } from '../utils/formatters';
import {
  CURATED_YOUTUBE_TRACKS,
  searchCuratedYouTubeTracks,
  extractYouTubeId,
} from '../data/youtubeCuratedTracks';

interface YouTubeStreamViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onAddToQueue: (track: Track) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  favoriteIds: Set<string>;
}

const QUICK_TAGS = [
  'Top Global Hits',
  'Afrobeats',
  'Hip-Hop & Rap',
  'Lo-Fi Chill Beats',
  'Synthwave 80s',
  'Pop Anthems',
  'Electronic & EDM',
  'Rock Classics',
  'R&B Soul',
];

export const YouTubeStreamView: React.FC<YouTubeStreamViewProps> = ({
  currentTrack,
  isPlaying,
  onPlayTrack,
  onAddToQueue,
  onOpenAddToPlaylist,
  onToggleFavorite,
  favoriteIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>(
    CURATED_YOUTUBE_TRACKS['Top Global Hits'] || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeTag, setActiveTag] = useState('Top Global Hits');
  const [addedQueueId, setAddedQueueId] = useState<string | null>(null);

  // Direct URL paste box state
  const [directLinkInput, setDirectLinkInput] = useState('');
  const [isResolvingLink, setIsResolvingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const fetchYouTubeTracks = async (query: string) => {
    setIsLoading(true);

    // 1. Check if user typed a direct YouTube URL or 11-char Video ID
    const directVideoId = extractYouTubeId(query);
    if (directVideoId) {
      try {
        const noembedResp = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${directVideoId}`
        );
        const data = await noembedResp.json();
        const customTrack: YouTubeSearchResult = {
          id: directVideoId,
          title: data.title || `YouTube Stream (${directVideoId})`,
          fullTitle: data.title || `YouTube Stream (${directVideoId})`,
          artist: data.author_name || 'YouTube Creator',
          durationStr: '3:30',
          durationSeconds: 210,
          thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${directVideoId}/hqdefault.jpg`,
          views: 'Direct Link',
        };
        const fallbacks = searchCuratedYouTubeTracks(query).filter((t) => t.id !== directVideoId);
        setResults([customTrack, ...fallbacks]);
        setIsLoading(false);
        return;
      } catch {
        // Continue to server or curated fallback
      }
    }

    // 2. Try relative server API (works when connected to local/remote server)
    try {
      const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          setResults(data.results);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // In standalone mobile APK, local backend may be unreachable
    }

    // 3. Fallback to rich curated tracks catalogue (offline & standalone APK proof)
    const fallbackList = searchCuratedYouTubeTracks(query);
    setResults(fallbackList);
    setIsLoading(false);
  };

  useEffect(() => {
    // Initial fetch with fallback pre-loaded
    fetchYouTubeTracks('Top Global Hits');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveTag('');
    fetchYouTubeTracks(searchQuery);
  };

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setSearchQuery(tag);
    if (CURATED_YOUTUBE_TRACKS[tag]) {
      setResults(CURATED_YOUTUBE_TRACKS[tag]);
    } else {
      fetchYouTubeTracks(tag);
    }
  };

  const handleDirectLinkStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    if (!directLinkInput.trim()) return;

    const vid = extractYouTubeId(directLinkInput);
    if (!vid) {
      setLinkError('Please enter a valid YouTube video link (e.g. https://youtu.be/... or watch?v=...)');
      return;
    }

    setIsResolvingLink(true);
    try {
      const noembedResp = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`
      );
      const data = await noembedResp.json();
      const directTrack: YouTubeSearchResult = {
        id: vid,
        title: data.title || `YouTube Audio (${vid})`,
        fullTitle: data.title || `YouTube Audio (${vid})`,
        artist: data.author_name || 'YouTube Stream',
        durationStr: '3:30',
        durationSeconds: 210,
        thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        views: 'Direct Link',
      };

      setResults((prev) => [directTrack, ...prev.filter((t) => t.id !== vid)]);
      handlePlayItem(directTrack);
      setDirectLinkInput('');
    } catch {
      // If noembed failed, still play by ID
      const directTrack: YouTubeSearchResult = {
        id: vid,
        title: `YouTube Stream (${vid})`,
        fullTitle: `YouTube Stream (${vid})`,
        artist: 'YouTube Creator',
        durationStr: '3:30',
        durationSeconds: 210,
        thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        views: 'Direct Link',
      };
      setResults((prev) => [directTrack, ...prev.filter((t) => t.id !== vid)]);
      handlePlayItem(directTrack);
      setDirectLinkInput('');
    } finally {
      setIsResolvingLink(false);
    }
  };

  const convertToTrack = (item: YouTubeSearchResult): Track => {
    return {
      id: `yt-${item.id}`,
      title: item.title,
      artist: item.artist,
      album: 'YouTube Stream',
      duration: item.durationSeconds,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      format: 'youtube',
      youtubeId: item.id,
      coverArtUrl: item.thumbnail,
      coverGradient: generateCoverGradient(item.title),
      fileSize: 0,
      bitrate: 256,
      addedAt: Date.now(),
      isFavorite: favoriteIds.has(`yt-${item.id}`),
    };
  };

  const handlePlayItem = (item: YouTubeSearchResult) => {
    const track = convertToTrack(item);
    const convertedQueue = results.map(convertToTrack);
    onPlayTrack(track, convertedQueue);
  };

  const handleQueueItem = (item: YouTubeSearchResult) => {
    const track = convertToTrack(item);
    onAddToQueue(track);
    setAddedQueueId(item.id);
    setTimeout(() => setAddedQueueId(null), 1800);
  };

  return (
    <div className="youtube-view flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto w-full pb-[calc(10rem+max(env(safe-area-inset-bottom,0px),1.5rem))]">
      {/* Top Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#1c080c] via-[#16161a] to-[#0c0c0e] border border-[#ff3e3e]/30 p-5 sm:p-7 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#ff3e3e]/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#ff3e3e] text-black uppercase">
              Free Music Stream
            </span>
            <span className="text-[10px] font-mono tracking-wider text-[#f2efeb]/60 uppercase">
              Zero Signup • Unlimited Listening
            </span>
          </div>
          <h2 className="font-syne font-extrabold text-2xl sm:text-3xl text-[#f2efeb] tracking-tight mb-2">
            Search & Stream Any Song on YouTube
          </h2>
          <p className="text-xs sm:text-sm text-[#f2efeb]/70 mb-4 leading-relaxed">
            Free mobile audio streaming with official artist tracks, hit albums, and viral singles without signing up or creating an account.
          </p>

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#f2efeb]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search song title or artist (e.g. Burna Boy, Asake, Blinding Lights, Drake)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#0c0c0e] border border-white/10 focus:border-[#ff3e3e] focus:outline-none text-[#f2efeb] placeholder:text-[#f2efeb]/40 rounded-xl transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#ff3e3e] hover:bg-[#e03030] text-black font-syne font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-2 cursor-pointer transition active:scale-95 shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>

          {/* Direct Link Streaming Input (Useful on mobile) */}
          <form onSubmit={handleDirectLinkStream} className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 className="w-3.5 h-3.5 text-[#ff3e3e]/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Or paste any YouTube video link here to stream directly..."
                value={directLinkInput}
                onChange={(e) => setDirectLinkInput(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0c0c0e]/80 border border-white/10 focus:border-[#ff3e3e] focus:outline-none text-[#f2efeb] placeholder:text-[#f2efeb]/40 rounded-lg transition"
              />
            </div>
            <button
              type="submit"
              disabled={isResolvingLink}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              {isResolvingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff3e3e]" /> : <Play className="w-3 h-3 fill-current text-[#ff3e3e]" />}
              <span>Stream Link</span>
            </button>
          </form>
          {linkError && <p className="text-[11px] text-red-400 mt-1">{linkError}</p>}

          {/* Quick Genre Tags */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`text-[11px] px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activeTag === tag
                    ? 'bg-[#ff3e3e] text-black font-extrabold shadow-md shadow-[#ff3e3e]/30'
                    : 'bg-[#16161a] text-[#f2efeb]/70 hover:text-white hover:bg-[#202026] border border-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#ff3e3e]" />
          <h3 className="font-syne font-bold text-sm sm:text-base text-[#f2efeb] uppercase tracking-wide">
            {searchQuery ? `Search Results for "${searchQuery}"` : activeTag || 'Popular Streams'}
          </h3>
          <span className="text-[11px] font-mono text-[#f2efeb]/50">
            ({results.length} tracks ready)
          </span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#ff3e3e]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Fetching streams...</span>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((item) => {
            const isCurrentlyPlaying = isPlaying && currentTrack?.youtubeId === item.id;
            const isFav = favoriteIds.has(`yt-${item.id}`);
            const justAdded = addedQueueId === item.id;

            return (
              <div
                key={item.id}
                className={`group relative rounded-2xl bg-[#16161a] border transition-all p-3 flex flex-col justify-between hover:border-[#ff3e3e]/70 hover:shadow-xl ${
                  isCurrentlyPlaying
                    ? 'border-[#ff3e3e] bg-[#ff3e3e]/5 shadow-lg shadow-[#ff3e3e]/10'
                    : 'border-white/10'
                }`}
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black mb-3">
                    <img
                      src={item.thumbnail}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
                      }}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Duration badge */}
                    <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-[#f2efeb] font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold border border-white/10">
                      {item.durationStr}
                    </span>

                    {/* YouTube Source Badge */}
                    <span className="absolute top-1.5 left-1.5 bg-[#ff3e3e] text-black font-syne font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      YouTube
                    </span>

                    {/* Play Overlay */}
                    <div
                      onClick={() => handlePlayItem(item)}
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity ${
                        isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-[#ff3e3e] text-black flex items-center justify-center shadow-lg active:scale-90 transition">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Title & Channel */}
                  <h4
                    onClick={() => handlePlayItem(item)}
                    title={item.title}
                    className="font-syne font-bold text-xs sm:text-sm text-[#f2efeb] line-clamp-2 cursor-pointer hover:text-[#ff3e3e] transition leading-snug"
                  >
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#f2efeb]/60 mt-1 truncate">
                    {item.artist} {item.views ? `• ${item.views}` : ''}
                  </p>
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handlePlayItem(item)}
                    className="flex-1 py-1.5 px-3 bg-[#ff3e3e] hover:bg-[#e03030] text-black text-[11px] font-syne font-bold rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isCurrentlyPlaying ? 'Playing' : 'Stream'}</span>
                  </button>

                  <button
                    onClick={() => handleQueueItem(item)}
                    title="Add to Next Up Queue"
                    className="p-1.5 rounded-xl bg-[#0c0c0e] hover:bg-[#202026] text-[#f2efeb]/80 hover:text-white border border-white/10 transition cursor-pointer"
                  >
                    {justAdded ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onOpenAddToPlaylist(convertToTrack(item))}
                    title="Add to Playlist"
                    className="p-1.5 rounded-xl bg-[#0c0c0e] hover:bg-[#202026] text-[#f2efeb]/80 hover:text-white border border-white/10 transition cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleFavorite(convertToTrack(item))}
                    title="Favorite"
                    className="p-1.5 rounded-xl bg-[#0c0c0e] hover:bg-[#202026] text-[#f2efeb]/80 hover:text-[#ff3e3e] border border-white/10 transition cursor-pointer"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#ff3e3e] text-[#ff3e3e]' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !isLoading && (
          <div className="p-12 text-center rounded-2xl bg-[#16161a] border border-white/10">
            <Radio className="w-10 h-10 text-[#ff3e3e] mx-auto mb-3 opacity-60" />
            <h4 className="font-syne font-bold text-base text-[#f2efeb]">No tracks found</h4>
            <p className="text-xs text-[#f2efeb]/60 mt-1 max-w-sm mx-auto">
              Try searching with different keywords, artist name, or select a genre tag above.
            </p>
          </div>
        )
      )}
    </div>
  );
};
