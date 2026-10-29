import React, { useState } from 'react';
import { Sparkles, Music, Search, Play, Download, Plus, Globe, ExternalLink, Loader2, Disc3, Radio, RefreshCw } from 'lucide-react';
import { Track } from '../types/audio';
import { generateCoverGradient } from '../utils/formatters';

interface AiStudioViewProps {
  onPlayGeneratedTrack: (track: Track) => void;
  onAddGeneratedTrackToLibrary: (track: Track, audioBlob: Blob) => void;
}

export const AiStudioView: React.FC<AiStudioViewProps> = ({
  onPlayGeneratedTrack,
  onAddGeneratedTrackToLibrary,
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'search'>('generate');

  // Music Generator State (Lyria lyria-3-clip-preview)
  const [prompt, setPrompt] = useState('Energetic rock guitar riffs with heavy driving bassline');
  const [selectedGenre, setSelectedGenre] = useState('Rock');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    audioUrl: string;
    audioBlob: Blob;
    title: string;
    artist: string;
    album: string;
    lyrics: string;
    source: string;
  } | null>(null);

  // Search Grounding State (gemini-3.8-flash with googleSearch)
  const [searchQuery, setSearchQuery] = useState('Trending rock songs and albums 2026');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    summary: string;
    sources: { title: string; url: string }[];
    queries: string[];
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const GENRES = ['Rock', 'Pop', 'Classical', 'Jazz', 'Electronic', 'Synthwave', 'Hip-Hop', 'Acoustic'];

  const PROMPT_SUGGESTIONS = [
    'Heavy distortion rock riff with punchy bass and drums',
    'Smooth jazz quartet with saxophone and upright bass',
    'Upbeat pop synth chords with crisp melodic rhythm',
    'Classical grand piano sonata with dramatic cello swells',
    'Dark synthwave retro pulse with 80s analog bass',
  ];

  const SEARCH_SUGGESTIONS = [
    'Trending rock and metal album releases in 2026',
    'How do audio equalizers shape sound frequency response?',
    'Top 10 most influential jazz bassists in history',
    'Difference between 5-band EQ and parametric equalizer',
  ];

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, genre: selectedGenre }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success || !data.audioBase64) {
        throw new Error(data.error || 'Failed to produce audio stream');
      }

      // Convert base64 to Blob & URL
      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const audioUrl = URL.createObjectURL(blob);

      setGeneratedResult({
        audioUrl,
        audioBlob: blob,
        title: data.title || `${selectedGenre} Original Clip`,
        artist: data.artist || 'Lyria AI Engine',
        album: data.album || 'AI Soundtracks',
        lyrics: data.lyrics || 'Instrumental',
        source: data.source || 'lyria-3-clip-preview',
      });
    } catch (err: any) {
      console.error('Music Generation Error:', err);
      setGenerationError(err?.message || 'Failed to generate music clip. Check network connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSearchGrounding = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch('/api/search-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Search grounding failed');
      }

      setSearchResult({
        summary: data.summary,
        sources: data.sources || [],
        queries: data.queries || [searchQuery],
      });
    } catch (err: any) {
      console.error('Search Grounding Error:', err);
      setSearchError(err?.message || 'Search request failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayGenerated = () => {
    if (!generatedResult) return;
    const track: Track = {
      id: `lyria_${Date.now()}`,
      title: generatedResult.title,
      artist: generatedResult.artist,
      album: generatedResult.album,
      duration: 30,
      url: generatedResult.audioUrl,
      format: 'wav',
      coverGradient: generateCoverGradient(generatedResult.title),
      fileSize: generatedResult.audioBlob.size,
      addedAt: Date.now(),
      isFavorite: true,
      isCustom: true,
      fileName: `${generatedResult.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
    };
    onPlayGeneratedTrack(track);
  };

  const handleAddToLibrary = () => {
    if (!generatedResult) return;
    const track: Track = {
      id: `lyria_${Date.now()}`,
      title: generatedResult.title,
      artist: generatedResult.artist,
      album: generatedResult.album,
      duration: 30,
      url: generatedResult.audioUrl,
      format: 'wav',
      coverGradient: generateCoverGradient(generatedResult.title),
      fileSize: generatedResult.audioBlob.size,
      addedAt: Date.now(),
      isFavorite: true,
      isCustom: true,
      fileName: `${generatedResult.title.toLowerCase().replace(/\s+/g, '_')}.wav`,
    };
    onAddGeneratedTrackToLibrary(track, generatedResult.audioBlob);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 p-6 sm:p-10">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <span>AI Music Studio & Google Search Grounding</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Create original 30-second clips with Lyria AI and explore grounded live music information
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-900">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'generate'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Lyria Music Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'search'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Grounding</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Music Generation (Lyria 3 Clip Preview) */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            {/* Genre selector */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                1. Select Music Style / Genre
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                      selectedGenre === g
                        ? 'bg-red-600 text-white border border-red-500 shadow-md shadow-red-600/20'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt input */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                2. Describe Your Sound (English Prompt)
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Describe instruments, tempo, groove, or emotional feel in English..."
                className="w-full p-3 rounded-xl bg-black border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition resize-none"
              />

              {/* Inspiration prompts */}
              <div>
                <p className="text-[11px] text-zinc-500 mb-2 font-medium">Quick inspirations:</p>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(item)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition text-left"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <div className="pt-2">
                <button
                  onClick={handleGenerateMusic}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Track with Lyria AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate 30s {selectedGenre} Clip</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {generationError && (
              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs">
                {generationError}
              </div>
            )}
          </div>

          {/* Generated Audio Card */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-red-950/70 shadow-2xl space-y-5 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <Disc3 className="w-5 h-5 text-red-500 animate-spin-slow" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Generated Audio Output
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                    30 Seconds
                  </span>
                </div>

                {generatedResult ? (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 rounded-2xl bg-black border border-zinc-900 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-rose-800 flex items-center justify-center text-white font-bold shadow-md shadow-red-600/30">
                          ♪
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-white truncate">{generatedResult.title}</h3>
                          <p className="text-xs text-zinc-400">{generatedResult.artist}</p>
                          <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">Model: {generatedResult.source}</p>
                        </div>
                      </div>

                      {/* Built-in audio controller */}
                      <audio controls src={generatedResult.audioUrl} className="w-full mt-2 accent-red-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={handlePlayGenerated}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play in Player</span>
                      </button>

                      <button
                        onClick={handleAddToLibrary}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs border border-zinc-800 transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Save to Library</span>
                      </button>
                    </div>

                    <a
                      href={generatedResult.audioUrl}
                      download={`${generatedResult.title}.wav`}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium text-xs border border-zinc-800/80 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Offline WAV</span>
                    </a>
                  </div>
                ) : (
                  <div className="mt-8 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-red-500">
                      <Radio className="w-8 h-8" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-300">Ready to synthesize original audio</p>
                    <p className="text-[11px] text-zinc-500 max-w-xs">
                      Pick a genre, enter your prompt in English, and tap generate to synthesize audio using Lyria.
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 pt-4 border-t border-zinc-900">
                Powered by Google GenAI Lyria (<code className="text-red-400">lyria-3-clip-preview</code>)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Music Search Grounding (gemini-3.8-flash with googleSearch) */}
      {activeTab === 'search' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Real-Time Music Search Grounding (Google Search)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounding()}
                  placeholder="Search any artist, song release, discography, or music genre in English..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition"
                />
              </div>
              <button
                onClick={handleSearchGrounding}
                disabled={isSearching || !searchQuery.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/20 transition active:scale-95 disabled:opacity-50 shrink-0"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span>Search with Grounding</span>
              </button>
            </div>

            {/* Quick search chips */}
            <div>
              <p className="text-[11px] text-zinc-500 mb-2 font-medium">Trending queries:</p>
              <div className="flex flex-wrap gap-1.5">
                {SEARCH_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(item);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {searchError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs">
              {searchError}
            </div>
          )}

          {/* Search Result Box */}
          {searchResult && (
            <div className="p-6 rounded-3xl bg-zinc-950 border border-red-950/60 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-red-500" />
                  <span>Google Search Grounded Knowledge</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                  gemini-3.8-flash + googleSearch
                </span>
              </div>

              {/* Summary */}
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-200 whitespace-pre-line leading-relaxed">
                {searchResult.summary}
              </div>

              {/* Verified Sources */}
              {searchResult.sources.length > 0 && (
                <div className="pt-3 border-t border-zinc-900">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Verified Google Search References:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResult.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black hover:bg-zinc-900 border border-zinc-800/80 text-xs text-zinc-300 hover:text-white transition group"
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
