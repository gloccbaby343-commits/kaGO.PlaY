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
} from 'lucide-react';
import { Track, YouTubeSearchResult } from '../types/audio';
import { generateCoverGradient } from '../utils/formatters';

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
  'Hip-Hop & Rap',
  'Lo-Fi Chill Beats',
  'Synthwave 80s',
  'Pop Anthems',
  'Electronic & EDM',
  'Afrobeats',
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
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTag, setActiveTag] = useState('Top Global Hits');
  const [addedQueueId, setAddedQueueId] = useState<string | null>(null);

  const fetchYouTubeTracks = async (query: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data && Array.isArray(data.results)) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Failed to search YouTube:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYouTubeTracks('top global hits 2024');
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
    fetchYouTubeTracks(tag);
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
    <div className="youtube-view flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="relative rounded-sm bg-gradient-to-r from-[#1c080c] via-[#16161a] to-[#0c0c0e] border-2 border-[#ff3e3e]/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-[#ff3e3e]/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-sm bg-[#ff3e3e] text-black uppercase">
              Free Music Stream
            </span>
            <span className="text-[10px] font-mono tracking-wider text-[#f2efeb]/60 uppercase">
              Zero Signup • Unlimited Listening
            </span>
          </div>
          <h2 className="font-syne font-extrabold text-2xl sm:text-4xl text-[#f2efeb] tracking-tight mb-2">
            Search & Stream Any Song on YouTube
          </h2>
          <p className="text-xs sm:text-sm text-[#f2efeb]/70 mb-5 leading-relaxed">
            Instant global access to millions of tracks, official artist audios, and viral remixes without logging in or creating an account.
          </p>

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#f2efeb]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search song title, artist, or album (e.g. Blinding Lights, Drake, Synthwave)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#0c0c0e] border border-[#f2efeb]/20 focus:border-[#ff3e3e] focus:outline-none text-[#f2efeb] placeholder:text-[#f2efeb]/40 rounded-sm transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#ff3e3e] hover:bg-[#e03030] text-black font-syne font-bold text-xs sm:text-sm px-5 py-2.5 rounded-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer transition active:scale-95 shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>

          {/* Quick Genre Tags */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={`text-[11px] px-3 py-1 rounded-sm font-semibold transition cursor-pointer ${
                  activeTag === tag
                    ? 'bg-[#ff3e3e] text-black font-extrabold shadow-md shadow-[#ff3e3e]/30'
                    : 'bg-[#16161a] text-[#f2efeb]/70 hover:text-white hover:bg-[#202026] border border-[#f2efeb]/15'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between border-b border-[#f2efeb]/10 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#ff3e3e]" />
          <h3 className="font-syne font-bold text-sm sm:text-base text-[#f2efeb] uppercase tracking-wide">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Trending & Popular Streams'}
          </h3>
          <span className="text-[11px] font-mono text-[#f2efeb]/50">
            ({results.length} tracks found)
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
                className={`group relative rounded-sm bg-[#16161a] border transition-all p-3 flex flex-col justify-between hover:border-[#ff3e3e]/70 hover:shadow-xl ${
                  isCurrentlyPlaying
                    ? 'border-[#ff3e3e] bg-[#ff3e3e]/5 shadow-lg shadow-[#ff3e3e]/10'
                    : 'border-[#f2efeb]/10'
                }`}
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full rounded-xs overflow-hidden bg-black mb-3">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Duration badge */}
                    <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-[#f2efeb] font-mono text-[10px] px-1.5 py-0.5 rounded-xs font-bold border border-white/10">
                      {item.durationStr}
                    </span>

                    {/* YouTube Source Badge */}
                    <span className="absolute top-1.5 left-1.5 bg-[#ff3e3e] text-black font-syne font-extrabold text-[9px] px-1.5 py-0.5 rounded-xs uppercase tracking-wider">
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
                <div className="mt-4 pt-2.5 border-t border-[#f2efeb]/10 flex items-center justify-between gap-1">
                  <button
                    onClick={() => handlePlayItem(item)}
                    className="flex-1 py-1.5 px-2 bg-[#ff3e3e] hover:bg-[#e03030] text-black text-[11px] font-syne font-bold rounded-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isCurrentlyPlaying ? 'Playing' : 'Stream'}</span>
                  </button>

                  <button
                    onClick={() => handleQueueItem(item)}
                    title="Add to Next Up Queue"
                    className="p-1.5 rounded-xs bg-[#0c0c0e] hover:bg-[#202026] text-[#f2efeb]/80 hover:text-white border border-[#f2efeb]/15 transition cursor-pointer"
                  >
                    {justAdded ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => onOpenAddToPlaylist(convertToTrack(item))}
                    title="Add to Playlist"
                    className="p-1.5 rounded-xs bg-[#0c0c0e] hover:bg-[#202026] text-[#f2efeb]/80 hover:text-white border border-[#f2efeb]/15 transition cursor-pointer"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onToggleFavorite(convertToTrack(item))}
                    title="Favorite"
                    className="p-1.5 rounded-xs bg-[#0c0c0e] hover:bg-[#202026] text-[#f2efeb]/80 hover:text-[#ff3e3e] border border-[#f2efeb]/15 transition cursor-pointer"
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
          <div className="p-12 text-center rounded-sm bg-[#16161a] border border-[#f2efeb]/10">
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
