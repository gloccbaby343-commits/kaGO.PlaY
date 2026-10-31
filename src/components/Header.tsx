import React, { useRef } from 'react';
import { Search, HardDrive, BookOpen, Music2, Sliders, FileAudio, Youtube } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenScanner: () => void;
  onOpenEQ: () => void;
  onOpenGuide: () => void;
  onPickAndPlayFile: (file: File) => void;
  bassBoostEnabled?: boolean;
  onSearchYouTube?: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenScanner,
  onOpenEQ,
  onOpenGuide,
  onPickAndPlayFile,
  bassBoostEnabled,
  onSearchYouTube,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onPickAndPlayFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.3)] px-4 sm:px-8 pt-safe-top pb-3.5 flex items-center justify-between gap-3 transition-colors">
      {/* Brand Logo (Visible on mobile header) */}
      <div className="flex items-center gap-2.5 lg:hidden shrink-0">
        <div className="w-8 h-8 rounded-xl bg-[#ff3e3e] flex items-center justify-center shadow-[0_0_15px_rgba(255,62,62,0.4)]">
          <Music2 className="w-4 h-4 text-[#0c0c0e]" />
        </div>
        <span className="font-syne font-extrabold text-base tracking-tighter text-[#f2efeb] hidden xs:inline">
          kaGO.PIaY
        </span>
      </div>

      {/* Apple-style Frosted Search Bar */}
      <div className="flex-1 max-w-md relative min-w-[120px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim() && onSearchYouTube) {
              onSearchYouTube(searchQuery);
            }
          }}
          className="relative w-full"
        >
          <Search className="w-3.5 h-3.5 text-[#f2efeb]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tracks or press Enter to Stream YouTube..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-20 py-1.5 text-xs sm:text-sm bg-white/[0.06] border border-white/[0.12] focus:border-[#ff3e3e]/80 focus:bg-white/[0.09] backdrop-blur-md rounded-xl text-[#f2efeb] placeholder:text-[#f2efeb]/40 transition shadow-inner focus:outline-none"
          />
          {searchQuery.trim() && onSearchYouTube && (
            <button
              type="submit"
              title="Search and stream on YouTube"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-syne font-extrabold px-2.5 py-0.5 rounded-lg bg-[#ff3e3e] text-black hover:bg-[#e03030] shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <Youtube className="w-2.5 h-2.5" />
              <span>STREAM</span>
            </button>
          )}
        </form>
      </div>

      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Pick Song Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Pick and play audio file from storage"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.14] text-[#f2efeb] font-syne font-bold text-xs uppercase transition active:scale-95 cursor-pointer rounded-xl backdrop-blur-md shadow-sm"
          title="Select a song directly from your storage and play immediately"
        >
          <FileAudio className="w-3.5 h-3.5 text-[#ff3e3e]" />
          <span>Pick Song</span>
        </button>

        {/* EQ Settings Button */}
        <button
          onClick={onOpenEQ}
          aria-label="Equalizer and bass boost settings"
          className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs cursor-pointer transition active:scale-95 rounded-xl backdrop-blur-md ${
            bassBoostEnabled
              ? 'bg-[#ff3e3e]/15 border-[#ff3e3e]/50 text-[#ff3e3e]'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.10] text-[#f2efeb]'
          }`}
          title="Audio Equalizer & Bass Boost"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="label !opacity-100 hidden sm:inline">EQ Settings</span>
          {bassBoostEnabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff3e3e] animate-pulse" />
          )}
        </button>

        {/* Scan Storage Button */}
        <button
          onClick={onOpenScanner}
          aria-label="Scan device audio files"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.10] text-[#f2efeb] text-xs cursor-pointer transition rounded-xl backdrop-blur-md"
        >
          <HardDrive className="w-3.5 h-3.5 opacity-60" />
          <span className="label !opacity-100">Folder Tool</span>
        </button>

        {/* Mobile Guide Button */}
        <button
          onClick={onOpenGuide}
          aria-label="Mobile audio architecture guide"
          className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.10] text-[#f2efeb] text-xs cursor-pointer transition rounded-xl backdrop-blur-md"
        >
          <BookOpen className="w-3.5 h-3.5 opacity-60" />
          <span className="label !opacity-100">Architecture</span>
        </button>
      </div>
    </header>
  );
};
