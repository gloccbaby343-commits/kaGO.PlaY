import React, { useState, useMemo, useRef } from 'react';
import {
  Play,
  Shuffle,
  Heart,
  ListPlus,
  ArrowUpDown,
  Music2,
  Trash2,
  HardDrive,
  Volume2,
  Pencil,
  Check,
  X,
  AlertCircle,
  Folder,
  FolderPlus,
  FolderUp,
  FolderOpen,
  ArrowLeft,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Track } from '../types/audio';
import { formatTime, formatFileSize } from '../utils/formatters';
import { groupTracksByFolder, getTracksInFolder } from '../utils/folderUtils';
import { hasCjkOrForeignGibberish } from '../utils/id3Parser';

interface SongsViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onShuffleAll: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddToPlaylist: (track: Track) => void;
  onDeleteTrack?: (id: string) => void;
  onOpenScanner: () => void;
  onPickAndPlayFile?: (file: File) => void;
  onRenameTrack?: (id: string, newTitle: string, newArtist: string) => void;
  onClearCorruptedTracks?: () => void;
  onUploadFolder?: (files: File[], folderName?: string) => Promise<void>;
  onDeleteFolder?: (folderName: string) => Promise<void>;
  onGenerateAlbumArt?: (track: Track, preferAi?: boolean) => Promise<void>;
  onBatchGenerateAlbumArt?: () => Promise<void>;
}

export const SongsView: React.FC<SongsViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onShuffleAll,
  onToggleFavorite,
  onOpenAddToPlaylist,
  onDeleteTrack,
  onOpenScanner,
  onPickAndPlayFile,
  onRenameTrack,
  onClearCorruptedTracks,
  onUploadFolder,
  onDeleteFolder,
  onGenerateAlbumArt,
  onBatchGenerateAlbumArt,
}) => {
  const songsFileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const addFilesToFolderInputRef = useRef<HTMLInputElement | null>(null);

  // View States
  const [activeTab, setActiveTab] = useState<'all' | 'folders'>('all');
  const [openedFolderName, setOpenedFolderName] = useState<string | null>(null);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration' | 'added'>('title');

  // Loading & Drag-and-Drop States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Track Rename Dialog State
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');

  // Delete Folder Confirmation Dialog
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // Calculate Folders Summary
  const folderSummaries = useMemo(() => {
    return groupTracksByFolder(tracks);
  }, [tracks]);

  // Selected folder data if opened
  const currentFolderSummary = useMemo(() => {
    if (!openedFolderName) return null;
    return folderSummaries.find((f) => f.name === openedFolderName) || null;
  }, [openedFolderName, folderSummaries]);

  // Tracks inside opened folder (with search filter)
  const folderTracks = useMemo(() => {
    if (!openedFolderName) return [];
    return getTracksInFolder(tracks, openedFolderName, folderSearchQuery);
  }, [tracks, openedFolderName, folderSearchQuery]);

  const hasCorrupted = tracks.some(
    (t) =>
      t.title.toLowerCase().includes('english melody') ||
      t.title.toLowerCase().includes('melody english') ||
      hasCjkOrForeignGibberish(t.title) ||
      hasCjkOrForeignGibberish(t.artist)
  );

  const handleStartRename = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrack(track);
    setEditTitle(track.title);
    setEditArtist(track.artist);
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrack && editTitle.trim() && onRenameTrack) {
      onRenameTrack(editingTrack.id, editTitle.trim(), editArtist.trim() || 'Unknown Artist');
    }
    setEditingTrack(null);
  };

  // Upload folder trigger
  const handleFolderUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    e.target.value = '';

    let detectedName = 'Uploaded Music';
    const rel = (files[0] as any)?.webkitRelativePath || '';
    if (rel && rel.includes('/')) {
      detectedName = rel.split('/')[0];
    }

    if (onUploadFolder) {
      setIsUploading(true);
      setUploadStatus(`Reading ${files.length} audio files from "${detectedName}"...`);
      try {
        await onUploadFolder(files, detectedName);
        setOpenedFolderName(detectedName);
      } finally {
        setIsUploading(false);
        setUploadStatus(null);
      }
    }
  };

  // Add more files into an already opened folder
  const handleAddFilesToOpenedFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!openedFolderName || !e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    e.target.value = '';

    if (onUploadFolder) {
      setIsUploading(true);
      setUploadStatus(`Adding ${files.length} song${files.length > 1 ? 's' : ''} to "${openedFolderName}"...`);
      try {
        await onUploadFolder(files, openedFolderName);
      } finally {
        setIsUploading(false);
        setUploadStatus(null);
      }
    }
  };

  // Drag and drop handler for folders and files
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return f.type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext);
      });

      if (audioFiles.length > 0 && onUploadFolder) {
        const rel = (audioFiles[0] as any)?.webkitRelativePath || '';
        const detectedName = rel.includes('/') ? rel.split('/')[0] : (openedFolderName || 'Uploaded Music');
        setIsUploading(true);
        setUploadStatus(`Processing ${audioFiles.length} dropped songs...`);
        try {
          await onUploadFolder(audioFiles, detectedName);
          setOpenedFolderName(detectedName);
        } finally {
          setIsUploading(false);
          setUploadStatus(null);
        }
      }
    }
  };

  const sortedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      if (sortBy === 'duration') return b.duration - a.duration;
      return b.addedAt - a.addedAt;
    });
  }, [tracks, sortBy]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
      className="relative space-y-6 animate-in fade-in duration-200 p-4 sm:p-8 pb-[calc(8rem+max(env(safe-area-inset-bottom,0px),1rem))]"
    >
      {/* Hidden File and Folder Inputs */}
      <input
        ref={songsFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && onPickAndPlayFile) {
            onPickAndPlayFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard for folder picker
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onChange={handleFolderUploadChange}
      />
      <input
        ref={addFilesToFolderInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
        multiple
        className="hidden"
        onChange={handleAddFilesToOpenedFolder}
      />

      {/* Drag & Drop Visual Indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl border-2 border-dashed border-[#ff3e3e] rounded-3xl m-3 flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
          <div className="p-5 rounded-2xl bg-[#ff3e3e]/20 border border-[#ff3e3e]/40 text-[#ff3e3e] shadow-[0_0_35px_rgba(255,62,62,0.4)] mb-3">
            <FolderUp className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-xl font-syne font-extrabold text-white">Drop Music Folder Here</h2>
          <p className="text-xs text-zinc-400 mt-1">Upload and read entire folder into your offline library</p>
        </div>
      )}

      {/* Uploading Status Overlay Banner */}
      {isUploading && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-black to-zinc-950 border border-red-500/40 shadow-xl flex items-center gap-3 animate-in slide-in-from-top duration-200">
          <Loader2 className="w-5 h-5 text-red-500 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">{uploadStatus || 'Processing uploaded audio folder...'}</p>
            <p className="text-[10px] text-zinc-400">Extracting ID3 tags, waveforms, and file metadata</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE A: AN UPLOADED FOLDER IS CURRENTLY OPENED (Folder Reader View)       */}
      {/* ========================================================================= */}
      {openedFolderName ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <button
              onClick={() => {
                setOpenedFolderName(null);
                setFolderSearchQuery('');
              }}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-medium transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-[#ff3e3e] group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to All Songs</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 hidden xs:inline">
                FOLDER DIRECTORY
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ff3e3e]/15 text-[#ff3e3e] border border-[#ff3e3e]/30 font-bold">
                {folderTracks.length} Audio File{folderTracks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Apple-style Glass Folder Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16161a] via-[#111115] to-black border border-white/[0.1] p-6 sm:p-8 shadow-2xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff3e3e]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
              {/* Folder Graphic / Artwork Badge */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#ff3e3e] via-rose-700 to-black flex items-center justify-center shrink-0 shadow-[0_10px_30px_rgba(255,62,62,0.3)] border border-white/20">
                <FolderOpen className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>

              {/* Folder Title & Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/[0.08] text-[#ff3e3e] font-bold border border-white/[0.06]">
                    Uploaded Folder
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Device Storage
                  </span>
                </div>
                <h1 className="font-syne text-2xl sm:text-3xl font-extrabold text-white truncate">
                  {openedFolderName}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 flex flex-wrap items-center gap-3">
                  <span>{folderTracks.length} music track{folderTracks.length !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{formatTime(currentFolderSummary?.totalDuration || 0)} playback</span>
                  {currentFolderSummary?.totalSize ? (
                    <>
                      <span>•</span>
                      <span>{formatFileSize(currentFolderSummary.totalSize)}</span>
                    </>
                  ) : null}
                </p>
              </div>

              {/* Folder Actions */}
              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                {folderTracks.length > 0 && (
                  <>
                    <button
                      onClick={() => onPlayTrack(folderTracks[0], folderTracks)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff3e3e] to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Play Folder</span>
                    </button>
                    <button
                      onClick={() => {
                        const shuffled = [...folderTracks].sort(() => Math.random() - 0.5);
                        onPlayTrack(shuffled[0], shuffled);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.1] font-semibold text-xs transition active:scale-95 cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Shuffle</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => addFilesToFolderInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs transition active:scale-95 cursor-pointer"
                  title="Add more music files to this folder"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#ff3e3e]" />
                  <span>Add Songs</span>
                </button>
                {onGenerateAlbumArt && folderTracks.length > 0 && (
                  <button
                    onClick={async () => {
                      for (const t of folderTracks) {
                        await onGenerateAlbumArt(t, false);
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 hover:text-white border border-purple-500/30 text-xs transition active:scale-95 cursor-pointer"
                    title="Generate AI visualizer album art for songs in this folder"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Covers</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Folder Internal Search Filter Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={folderSearchQuery}
                onChange={(e) => setFolderSearchQuery(e.target.value)}
                placeholder={`Search inside "${openedFolderName}"...`}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff3e3e]/50 transition"
              />
              {folderSearchQuery && (
                <button
                  onClick={() => setFolderSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {onDeleteFolder && currentFolderSummary?.hasCustom && (
              <button
                onClick={() => setFolderToDelete(openedFolderName)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                title="Delete this folder and all its songs from library"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Folder</span>
              </button>
            )}
          </div>

          {/* Music Files Reader List inside this Folder */}
          {folderTracks.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-zinc-950/80 border border-dashed border-zinc-800">
              <Music2 className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-300">
                {folderSearchQuery ? 'No matching songs found in folder' : 'No music files found in this folder'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                {folderSearchQuery
                  ? 'Try searching with different keywords.'
                  : 'Add songs to this folder from your device storage.'}
              </p>
              {!folderSearchQuery && (
                <button
                  onClick={() => addFilesToFolderInputRef.current?.click()}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff3e3e] hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Add Songs to "{openedFolderName}"</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-black/60 overflow-hidden backdrop-blur-md">
              {folderTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className={`group flex items-center justify-between p-3 sm:px-4 sm:py-3 transition-colors ${
                      isCurrent ? 'bg-[#ff3e3e]/15 border-l-2 border-[#ff3e3e]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Track info & play trigger */}
                    <div
                      onClick={() => onPlayTrack(track, folderTracks)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-6 text-center text-xs font-mono font-bold text-zinc-500 shrink-0">
                        {isCurrent ? (
                          isPlaying ? (
                            <Volume2 className="w-4 h-4 text-[#ff3e3e] animate-pulse mx-auto" />
                          ) : (
                            <span className="text-[#ff3e3e]">⏸</span>
                          )
                        ) : (
                          <span className="group-hover:hidden">{idx + 1}</span>
                        )}
                        {!isCurrent && (
                          <Play className="w-3.5 h-3.5 fill-current text-white hidden group-hover:block mx-auto" />
                        )}
                      </div>

                      {/* Cover Thumbnail */}
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.coverGradient} flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-white/[0.08]`}
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
                          <span className="text-xs font-bold text-white/80">♪</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isCurrent ? 'text-[#ff3e3e] font-bold' : 'text-zinc-200 group-hover:text-white'
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {track.artist}
                          {track.fileName && track.fileName !== track.title && (
                            <span className="text-zinc-500 ml-1.5 font-mono text-[10px]">
                              • {track.fileName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-1 sm:gap-2.5 ml-2 shrink-0">
                      <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-zinc-400 font-mono uppercase font-semibold">
                        {track.format}
                      </span>
                      <span className="text-xs font-mono text-zinc-400 w-12 text-right">
                        {formatTime(track.duration)}
                      </span>

                      {onGenerateAlbumArt && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateAlbumArt(track, false);
                          }}
                          aria-label="Generate AI album art"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-400 transition cursor-pointer"
                          title="Generate or fetch AI visualizer album art"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onRenameTrack && (
                        <button
                          onClick={(e) => handleStartRename(track, e)}
                          aria-label="Rename song"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition cursor-pointer"
                          title="Rename Song"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onToggleFavorite(track.id)}
                        aria-label="Toggle favorite"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 transition cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-[#ff3e3e] text-[#ff3e3e]' : ''}`} />
                      </button>

                      <button
                        onClick={() => onOpenAddToPlaylist(track)}
                        aria-label="Add to playlist"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition cursor-pointer"
                        title="Add to Playlist"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>

                      {track.isCustom && onDeleteTrack && (
                        <button
                          onClick={() => onDeleteTrack(track.id)}
                          aria-label="Delete track"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 transition hidden sm:inline-flex cursor-pointer"
                          title="Delete from Library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE B: DEFAULT SONGS TAB VIEW (Showing Uploaded Folders + All Songs List)*/
        /* ========================================================================= */
        <>
          {/* Top Controls & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
            <div>
              <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <Music2 className="w-5 h-5 text-[#ff3e3e]" />
                <span>All Songs</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
                  {tracks.length}
                </span>
                {folderSummaries.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff3e3e]/15 text-[#ff3e3e] border border-[#ff3e3e]/30 font-mono flex items-center gap-1">
                    <Folder className="w-3 h-3" />
                    <span>{folderSummaries.length} Folders</span>
                  </span>
                )}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Offline music library • Upload single songs or entire music folders
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* PRIMARY: Upload Music Folder Button */}
              <button
                onClick={() => folderInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ff3e3e] to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition active:scale-95 cursor-pointer"
                title="Upload an entire folder containing audio files from your device"
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>Upload Music Folder</span>
              </button>

              {/* Direct Pick Song Button */}
              <button
                onClick={() => songsFileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-medium transition active:scale-95 cursor-pointer"
                title="Select a single audio file from your device"
              >
                <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                <span>Select Song</span>
              </button>

              {/* Batch AI Album Art Generator */}
              {onBatchGenerateAlbumArt && tracks.length > 0 && (
                <button
                  onClick={() => onBatchGenerateAlbumArt()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 hover:text-white border border-purple-500/30 hover:border-purple-500/60 text-xs font-medium transition active:scale-95 cursor-pointer shadow-sm"
                  title="Fetch or generate AI visualizer album art for tracks missing covers"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Album Art</span>
                </button>
              )}

              {/* Quick Clear Legacy Corrupted Button if present */}
              {hasCorrupted && onClearCorruptedTracks && (
                <button
                  onClick={onClearCorruptedTracks}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs border border-amber-500/30 transition active:scale-95 cursor-pointer"
                  title="Fix and clean foreign or corrupted song names"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fix Song Names</span>
                </button>
              )}

              {tracks.length > 0 && (
                <>
                  <button
                    onClick={() => onPlayTrack(sortedTracks[0], sortedTracks)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-600/20 transition active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play All</span>
                  </button>
                  <button
                    onClick={onShuffleAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs border border-zinc-800 transition active:scale-95 cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Shuffle</span>
                  </button>
                </>
              )}

              {/* Sort Menu */}
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
                >
                  <option value="title" className="bg-zinc-950 text-zinc-200">Title</option>
                  <option value="artist" className="bg-zinc-950 text-zinc-200">Artist</option>
                  <option value="duration" className="bg-zinc-950 text-zinc-200">Duration</option>
                  <option value="added" className="bg-zinc-950 text-zinc-200">Date Added</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: All Songs vs Uploaded Folders */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white/[0.1] text-white border border-white/[0.15] shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              All Tracks ({tracks.length})
            </button>
            <button
              onClick={() => setActiveTab('folders')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'folders'
                  ? 'bg-[#ff3e3e]/20 text-[#ff3e3e] border border-[#ff3e3e]/40 shadow-sm'
                  : 'text-zinc-400 hover:text-[#ff3e3e] hover:bg-white/[0.04]'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Uploaded Folders ({folderSummaries.length})</span>
            </button>
          </div>

          {/* ===================================================================== */}
          {/* FOLDERS SHELF / CAROUSEL (Displayed when activeTab === 'all' and folders exist) */}
          {/* ===================================================================== */}
          {activeTab === 'all' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[#ff3e3e]" />
                  <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    Uploaded Music Folders
                  </h2>
                </div>
                {folderSummaries.length > 0 && (
                  <button
                    onClick={() => setActiveTab('folders')}
                    className="text-[11px] text-[#ff3e3e] hover:underline font-semibold cursor-pointer"
                  >
                    View All ({folderSummaries.length})
                  </button>
                )}
              </div>

              {/* Horizontal Scroll Shelf */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {folderSummaries.map((folder) => (
                  <div
                    key={folder.name}
                    onClick={() => setOpenedFolderName(folder.name)}
                    className="group relative rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] hover:from-white/[0.08] hover:to-white/[0.04] border border-white/[0.08] hover:border-[#ff3e3e]/40 p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-[0_8px_25px_rgba(255,62,62,0.15)] flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff3e3e]/30 via-red-950 to-black border border-[#ff3e3e]/30 flex items-center justify-center text-[#ff3e3e] group-hover:scale-105 transition-transform">
                        <Folder className="w-6 h-6 fill-current text-[#ff3e3e]" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (folder.tracks.length > 0) {
                            onPlayTrack(folder.tracks[0], folder.tracks);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-[#ff3e3e] text-white flex items-center justify-center transition active:scale-95 shadow-sm"
                        title="Play Folder"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-syne font-bold text-sm text-white truncate group-hover:text-[#ff3e3e] transition-colors">
                        {folder.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {folder.trackCount} song{folder.trackCount !== 1 ? 's' : ''} • {formatTime(folder.totalDuration)}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>OPEN FOLDER</span>
                      <span className="text-[#ff3e3e] font-bold group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                ))}

                {/* Quick Upload Folder Card */}
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-white/[0.1] hover:border-[#ff3e3e]/60 bg-white/[0.02] hover:bg-[#ff3e3e]/5 p-4 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px] group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] group-hover:bg-[#ff3e3e]/20 text-zinc-400 group-hover:text-[#ff3e3e] flex items-center justify-center mb-2 transition-colors">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
                    + Upload Folder
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">
                    Select a folder from phone/PC
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* FOLDERS GRID VIEW (Displayed when activeTab === 'folders')             */}
          {/* ===================================================================== */}
          {activeTab === 'folders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">
                  Select any uploaded folder to browse and play its audio files.
                </p>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff3e3e] text-white text-xs font-bold shadow-md shadow-red-600/30 transition cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Upload New Folder</span>
                </button>
              </div>

              {folderSummaries.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-dashed border-zinc-800">
                  <Folder className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-zinc-300">No Folders Uploaded Yet</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Upload an audio folder from your device storage to keep your music organized by directory.
                  </p>
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff3e3e] hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition cursor-pointer"
                  >
                    <FolderUp className="w-4 h-4" />
                    <span>Upload Music Folder</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {folderSummaries.map((folder) => (
                    <div
                      key={folder.name}
                      onClick={() => setOpenedFolderName(folder.name)}
                      className="group relative rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] hover:from-white/[0.09] hover:to-white/[0.05] border border-white/[0.1] hover:border-[#ff3e3e]/50 p-5 transition-all duration-200 cursor-pointer shadow-xl flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff3e3e]/30 via-red-950 to-black border border-[#ff3e3e]/40 flex items-center justify-center text-[#ff3e3e] group-hover:scale-105 transition-transform shadow-md">
                          <Folder className="w-7 h-7 fill-current text-[#ff3e3e]" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (folder.tracks.length > 0) {
                              onPlayTrack(folder.tracks[0], folder.tracks);
                            }
                          }}
                          className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-[#ff3e3e] text-white flex items-center justify-center transition active:scale-95 shadow-md cursor-pointer"
                          title="Play Folder"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                      </div>

                      <div>
                        <h3 className="font-syne font-bold text-base text-white truncate group-hover:text-[#ff3e3e] transition-colors">
                          {folder.name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          {folder.trackCount} song{folder.trackCount !== 1 ? 's' : ''} • {formatTime(folder.totalDuration)}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 font-mono">
                        <span>Read Songs</span>
                        <span className="text-[#ff3e3e] font-bold group-hover:translate-x-1 transition-transform">
                          Open Folder →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* ALL SONGS LIST (Only shown when activeTab === 'all')                   */}
          {/* ===================================================================== */}
          {activeTab === 'all' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Individual Audio Tracks ({sortedTracks.length})
                </h2>
              </div>

              {sortedTracks.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-zinc-950 border border-dashed border-zinc-800">
                  <Music2 className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-zinc-300">No songs found</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Upload an audio file or an entire music folder from your device storage.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => folderInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff3e3e] hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition cursor-pointer"
                    >
                      <FolderUp className="w-4 h-4" />
                      <span>Upload Folder</span>
                    </button>
                    <button
                      onClick={onOpenScanner}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-xs border border-zinc-800 transition cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4" />
                      <span>Scan Storage</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-zinc-900 rounded-2xl border border-zinc-900 bg-black/60 overflow-hidden">
                  {sortedTracks.map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        className={`group flex items-center justify-between p-3 sm:px-4 sm:py-3 transition-colors ${
                          isCurrent ? 'bg-red-950/40 border-l-2 border-[#ff3e3e]' : 'hover:bg-zinc-950/80'
                        }`}
                      >
                        {/* Left index & Title */}
                        <div
                          onClick={() => onPlayTrack(track, sortedTracks)}
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="w-6 text-center text-xs font-mono font-bold text-zinc-500 shrink-0">
                            {isCurrent ? (
                              isPlaying ? (
                                <Volume2 className="w-4 h-4 text-[#ff3e3e] animate-pulse mx-auto" />
                              ) : (
                                <span className="text-[#ff3e3e]">⏸</span>
                              )
                            ) : (
                              <span className="group-hover:hidden">{idx + 1}</span>
                            )}
                            {!isCurrent && (
                              <Play className="w-3.5 h-3.5 fill-current text-white hidden group-hover:block mx-auto" />
                            )}
                          </div>

                          {/* Artwork */}
                          <div
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${track.coverGradient} flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}
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
                              <span className="text-xs font-bold text-white/80">♪</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`text-xs sm:text-sm font-semibold truncate ${
                                isCurrent ? 'text-red-400 font-bold' : 'text-zinc-200 group-hover:text-white'
                              }`}
                            >
                              {track.title}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate">
                              <span>{track.artist}</span>
                              {track.folderName && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenedFolderName(track.folderName!);
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-[#ff3e3e]/20 text-zinc-400 hover:text-[#ff3e3e] border border-white/[0.08] transition shrink-0 cursor-pointer"
                                  title={`Open folder "${track.folderName}"`}
                                >
                                  <Folder className="w-2.5 h-2.5 text-[#ff3e3e]" />
                                  <span className="truncate max-w-[120px]">{track.folderName}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Metadata & Action Buttons */}
                        <div className="flex items-center gap-1 sm:gap-3 ml-2 shrink-0">
                          <span className="hidden md:inline text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono uppercase font-semibold">
                            {track.format}
                          </span>
                          <span className="text-xs font-mono text-zinc-400 w-12 text-right">
                            {formatTime(track.duration)}
                          </span>

                          {onGenerateAlbumArt && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onGenerateAlbumArt(track, false);
                              }}
                              aria-label="Generate AI album art"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-400 transition cursor-pointer"
                              title="Generate or fetch AI visualizer album art"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onRenameTrack && (
                            <button
                              onClick={(e) => handleStartRename(track, e)}
                              aria-label="Rename song"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-white transition cursor-pointer"
                              title="Rename Song"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onToggleFavorite(track.id)}
                            aria-label="Toggle favorite"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 transition cursor-pointer"
                          >
                            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-[#ff3e3e] text-[#ff3e3e]' : ''}`} />
                          </button>

                          <button
                            onClick={() => onOpenAddToPlaylist(track)}
                            aria-label="Add to playlist"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition cursor-pointer"
                            title="Add to Playlist"
                          >
                            <ListPlus className="w-4 h-4" />
                          </button>

                          {track.isCustom && onDeleteTrack && (
                            <button
                              onClick={() => onDeleteTrack(track.id)}
                              aria-label="Delete track"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 transition hidden sm:inline-flex cursor-pointer"
                              title="Delete from Library"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Track Rename Modal Dialog */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#ff3e3e]" />
                <h3 className="text-sm font-bold">Rename Song</h3>
              </div>
              <button
                onClick={() => setEditingTrack(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Song Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. hetera by elvo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500/60"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Artist</label>
                <input
                  type="text"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  placeholder="e.g. elvo or Local Artist"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-600/30 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Name</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Dialog */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-zinc-950 border border-red-500/30 rounded-2xl shadow-2xl p-6 text-zinc-100">
            <div className="flex items-center gap-2.5 text-rose-500 mb-3">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold">Delete Folder?</h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Are you sure you want to remove <strong className="text-white">"{folderToDelete}"</strong> and all its music files from your library?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setFolderToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (onDeleteFolder && folderToDelete) {
                    await onDeleteFolder(folderToDelete);
                    if (openedFolderName === folderToDelete) {
                      setOpenedFolderName(null);
                    }
                  }
                  setFolderToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition cursor-pointer"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
