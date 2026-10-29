import React, { useRef } from 'react';
import { Play, Disc3, FileAudio, Clock, Heart } from 'lucide-react';
import { Track } from '../types/audio';
import { formatTime, formatFileSize } from '../utils/formatters';

interface DashboardViewProps {
  tracks: Track[];
  recentTracks: Track[];
  favoriteTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onOpenScanner: () => void;
  onOpenEQ: () => void;
  onOpenGuide: () => void;
  onPickAndPlayFile?: (file: File) => void;
  bassBoostEnabled?: boolean;
  onToggleBassBoost?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tracks,
  recentTracks,
  favoriteTracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenScanner,
  onOpenEQ,
  onPickAndPlayFile,
  bassBoostEnabled = false,
}) => {
  const featuredTrack = currentTrack || tracks[0] || null;
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalBytes = tracks.reduce((acc, t) => acc + (t.fileSize || 0), 0);

  const dashFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onPickAndPlayFile) {
      onPickAndPlayFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-[calc(6rem+max(env(safe-area-inset-bottom,0px),1rem))]">
      {/* Hidden file input */}
      <input
        ref={dashFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
        className="hidden"
        onChange={handleFilePicked}
      />

      {/* Hero Section from Variation 2 */}
      {featuredTrack && (
        <section className="hero grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center p-6 sm:p-10 border-b border-[#f2efeb]/10">
          <div className="hero-content">
            <div className="label mb-2">Featured Track / {featuredTrack.title}</div>
            <h2 className="font-syne font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-[0.9] tracking-[-0.06em] text-[#f2efeb] my-3 uppercase">
              {featuredTrack.title}
            </h2>
            <p className="text-sm opacity-60 mb-6 text-[#f2efeb]">
              {featuredTrack.artist} • {featuredTrack.album}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onPlayTrack(featuredTrack, tracks)}
                className="bg-[#ff3e3e] hover:bg-[#e03030] text-[#0c0c0e] border-none py-3 px-6 font-syne font-extrabold text-sm uppercase tracking-wider cursor-pointer active:scale-95 transition rounded-sm flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isPlaying && currentTrack?.id === featuredTrack.id ? 'PLAYING NOW' : 'QUICK PLAY'}</span>
              </button>
              <button
                onClick={() => dashFileInputRef.current?.click()}
                className="bg-transparent border border-[#f2efeb] hover:bg-[#f2efeb]/10 text-[#f2efeb] py-3 px-6 font-syne font-extrabold text-sm uppercase tracking-wider cursor-pointer active:scale-95 transition rounded-sm flex items-center gap-2"
              >
                <FileAudio className="w-4 h-4 text-[#ff3e3e]" />
                <span>PICK SONG</span>
              </button>
            </div>
          </div>

          <div className="hero-visual aspect-square max-w-[320px] w-full mx-auto bg-[#16161a] border-2 border-[#f2efeb] relative flex items-center justify-center p-6 shadow-2xl rounded-sm">
            <div
              className={`w-full h-full rounded-full border border-[#f2efeb]/20 relative flex items-center justify-center ${
                isPlaying && currentTrack?.id === featuredTrack.id ? 'animate-spin-slow' : ''
              }`}
            >
              <div className="absolute inset-4 rounded-full border border-[#f2efeb]/15" />
              <div className="absolute inset-10 rounded-full border border-[#f2efeb]/15" />
              <div className="absolute inset-16 rounded-full border border-[#f2efeb]/15" />
              <div className="w-20 h-20 rounded-full bg-[#0c0c0e] border-2 border-[#ff3e3e] flex items-center justify-center p-2 text-center">
                <Disc3 className="w-8 h-8 text-[#ff3e3e]" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid Tools Section from Variation 2 */}
      <section className="grid-tools grid grid-cols-1 md:grid-cols-3 gap-6 px-6 sm:px-10">
        <div
          onClick={() => dashFileInputRef.current?.click()}
          className="tool-card border-t-2 border-[#f2efeb] pt-4 cursor-pointer group hover:border-[#ff3e3e] transition"
        >
          <div className="label">01 / Storage</div>
          <h3 className="font-syne font-bold text-base text-[#f2efeb] my-1 group-hover:text-[#ff3e3e] transition">
            Direct Offline Play
          </h3>
          <p className="text-xs opacity-60 leading-relaxed text-[#f2efeb]">
            Select any MP3, WAV, FLAC, or AAC track from storage to play offline immediately.
          </p>
        </div>

        <div
          onClick={onOpenEQ}
          className="tool-card border-t-2 border-[#f2efeb] pt-4 cursor-pointer group hover:border-[#ff3e3e] transition"
        >
          <div className="label">
            02 / DSP {bassBoostEnabled ? '• BASS ON' : ''}
          </div>
          <h3 className="font-syne font-bold text-base text-[#f2efeb] my-1 group-hover:text-[#ff3e3e] transition">
            Equalizer & Bass
          </h3>
          <p className="text-xs opacity-60 leading-relaxed text-[#f2efeb]">
            Presets, 5-band manual faders, and toggleable bass boost for optimal acoustics.
          </p>
        </div>

        <div
          onClick={onOpenScanner}
          className="tool-card border-t-2 border-[#f2efeb] pt-4 cursor-pointer group hover:border-[#ff3e3e] transition"
        >
          <div className="label">03 / Batch</div>
          <h3 className="font-syne font-bold text-base text-[#f2efeb] my-1 group-hover:text-[#ff3e3e] transition">
            Music Folders
          </h3>
          <p className="text-xs opacity-60 leading-relaxed text-[#f2efeb]">
            Batch scan entire music directories or drag-and-drop multiple local albums at once.
          </p>
        </div>
      </section>

      {/* Editorial Stats Snapshot */}
      <div className="mx-6 sm:mx-10 p-5 bg-[#16161a] border border-[#f2efeb]/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left rounded-sm">
        <div>
          <span className="label">Total Songs</span>
          <p className="font-syne text-xl font-bold text-[#f2efeb] mt-1">{tracks.length.toString().padStart(2, '0')}</p>
        </div>
        <div>
          <span className="label">Playback Time</span>
          <p className="font-syne text-xl font-bold text-[#f2efeb] mt-1">{formatTime(totalDuration)}</p>
        </div>
        <div>
          <span className="label">Cached Audio</span>
          <p className="font-syne text-xl font-bold text-[#f2efeb] mt-1">{formatFileSize(totalBytes)}</p>
        </div>
        <div>
          <span className="label">Audio Engine</span>
          <p className="font-syne text-xl font-bold text-[#ff3e3e] mt-1">NATIVE</p>
        </div>
      </div>

      {/* Recently Played Section */}
      {recentTracks.length > 0 && (
        <section className="px-6 sm:px-10">
          <div className="flex items-center justify-between mb-3 border-b border-[#f2efeb]/10 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ff3e3e]" />
              <h2 className="font-syne text-base font-bold text-[#f2efeb]">Recently Played</h2>
            </div>
            <span className="label">{recentTracks.length} tracks</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {recentTracks.slice(0, 5).map((track) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track, recentTracks)}
                className="p-3 bg-[#16161a] hover:bg-[#1a1a20] border border-[#f2efeb]/10 hover:border-[#ff3e3e]/40 transition cursor-pointer group flex flex-col rounded-sm"
              >
                <div
                  className={`aspect-square w-full bg-gradient-to-br ${track.coverGradient} relative flex items-center justify-center overflow-hidden mb-2.5 shadow-md border border-[#f2efeb]/10 rounded-sm`}
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
                    <span className="font-syne text-2xl font-bold text-white/70">♪</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#ff3e3e] text-[#0c0c0e] flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="font-syne text-xs font-bold text-[#f2efeb] truncate group-hover:text-[#ff3e3e] transition">
                  {track.title}
                </h4>
                <p className="text-[11px] opacity-60 truncate mt-0.5 text-[#f2efeb]">{track.artist}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Favorites Section */}
      {favoriteTracks.length > 0 && (
        <section className="px-6 sm:px-10">
          <div className="flex items-center justify-between mb-3 border-b border-[#f2efeb]/10 pb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#ff3e3e] fill-[#ff3e3e]" />
              <h2 className="font-syne text-base font-bold text-[#f2efeb]">Favorites</h2>
            </div>
            <span className="label">{favoriteTracks.length} tracks</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {favoriteTracks.slice(0, 6).map((track) => (
              <div
                key={track.id}
                onClick={() => onPlayTrack(track, favoriteTracks)}
                className="p-3 bg-[#16161a] hover:bg-[#1a1a20] border border-[#f2efeb]/10 hover:border-[#ff3e3e]/40 transition cursor-pointer flex items-center justify-between group rounded-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${track.coverGradient} flex items-center justify-center shrink-0 overflow-hidden shadow border border-[#f2efeb]/10 rounded-sm`}
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
                      <span className="text-xs font-bold text-white">♪</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-syne text-xs font-bold text-[#f2efeb] truncate group-hover:text-[#ff3e3e] transition">
                      {track.title}
                    </p>
                    <p className="text-[11px] opacity-60 truncate text-[#f2efeb]">{track.artist}</p>
                  </div>
                </div>
                <span className="label !opacity-80 ml-2">{formatTime(track.duration)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
