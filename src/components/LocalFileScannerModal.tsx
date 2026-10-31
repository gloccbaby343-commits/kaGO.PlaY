import React, { useState, useRef } from 'react';
import { FolderSearch, Music, Upload, X, Check, HardDrive, FileAudio, Loader2, Play } from 'lucide-react';
import { parseAudioFile } from '../utils/id3Parser';
import { Track } from '../types/audio';
import { formatFileSize, formatTime } from '../utils/formatters';

interface LocalFileScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTracks: (tracks: Track[], rawFiles?: File[], autoPlay?: boolean) => void;
}

export const LocalFileScannerModal: React.FC<LocalFileScannerModalProps> = ({
  isOpen,
  onClose,
  onImportTracks,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [scannedTracks, setScannedTracks] = useState<{ track: Track; file: File }[]>([]);
  const [saveToOfflineStorage, setSaveToOfflineStorage] = useState(true);
  const [autoPlayImmediately, setAutoPlayImmediately] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processFiles = async (fileList: FileList | File[], explicitFolderName?: string) => {
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
    const files = Array.from(fileList).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return f.type.startsWith('audio/') || audioExtensions.includes(ext);
    });

    if (files.length === 0) {
      setStatusMessage('No supported audio files (MP3, WAV, FLAC, AAC, OGG) found in selection.');
      return;
    }

    // Auto-detect folder name if not explicitly provided
    let folderName = explicitFolderName;
    if (!folderName) {
      const rel = (files[0] as any)?.webkitRelativePath || '';
      if (rel && rel.includes('/')) {
        folderName = rel.split('/')[0];
      }
    }

    setIsScanning(true);
    setStatusMessage(`Reading ${files.length} audio file${files.length > 1 ? 's' : ''}${folderName ? ` from "${folderName}"` : ''}...`);

    const newScanned: { track: Track; file: File }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatusMessage(`Reading: ${file.name}`);
      try {
        const track = await parseAudioFile(file, folderName);
        newScanned.push({ track, file });
      } catch (err) {
        console.error('Failed to parse file:', file.name, err);
      }
    }

    setScannedTracks((prev) => [...prev, ...newScanned]);
    setIsScanning(false);
    setStatusMessage(`Loaded ${newScanned.length} track${newScanned.length > 1 ? 's' : ''}.`);

    // If autoPlayImmediately is enabled, automatically import and start playing the song right away!
    if (autoPlayImmediately && newScanned.length > 0) {
      const tracksToImport = newScanned.map((s) => s.track);
      const rawFilesToImport = saveToOfflineStorage ? newScanned.map((s) => s.file) : undefined;
      onImportTracks(tracksToImport, rawFilesToImport, true);
      onClose();
    }
  };

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const handleSelectFolder = () => {
    // In iframes, showDirectoryPicker throws SecurityError. Safely use webkitdirectory input directly
    const isInIframe = window.self !== window.top;
    if (!isInIframe && 'showDirectoryPicker' in window) {
      (async () => {
        try {
          // @ts-expect-error showDirectoryPicker is standard in Chromium
          const dirHandle = await window.showDirectoryPicker();
          setIsScanning(true);
          setStatusMessage(`Scanning directory "${dirHandle.name}"...`);
          const foundFiles: File[] = [];

          for await (const entry of (dirHandle as any).values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              const ext = file.name.split('.').pop()?.toLowerCase() || '';
              if (file.type.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
                foundFiles.push(file);
              }
            }
          }
          await processFiles(foundFiles, dirHandle.name);
        } catch (err: unknown) {
          if ((err as Error)?.name !== 'AbortError') {
            folderInputRef.current?.click();
          }
        }
      })();
    } else {
      folderInputRef.current?.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleConfirmImport = (autoPlay = false) => {
    if (scannedTracks.length === 0) return;
    const tracks = scannedTracks.map((s) => s.track);
    const rawFiles = saveToOfflineStorage ? scannedTracks.map((s) => s.file) : undefined;
    onImportTracks(tracks, rawFiles, autoPlay);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 pt-[max(env(safe-area-inset-top,0px),1.75rem)] pb-[max(env(safe-area-inset-bottom,0px),1.5rem)] animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-sm bg-[#16161a] border-2 border-[#f2efeb] shadow-2xl p-5 sm:p-6 text-[#f2efeb] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f2efeb]/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-sm bg-[#ff3e3e]/15 text-[#ff3e3e] border border-[#ff3e3e]/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-syne text-lg font-bold text-[#f2efeb]">Select Offline Audio from Storage</h2>
              <p className="label !opacity-60 text-[10px]">Choose MP3, WAV, FLAC, AAC files to play offline instantly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs - with explicit file extensions for compatibility across all mobile & desktop OS */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
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
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const files = Array.from(e.target.files);
              const rel = (files[0] as any)?.webkitRelativePath || '';
              const detectedFolder = rel.includes('/') ? rel.split('/')[0] : undefined;
              processFiles(files, detectedFolder);
            }
          }}
        />

        {/* Primary Call to Action: Quick Pick Single/Multi Song */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-black via-zinc-950 to-neutral-950 border border-red-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-red-950/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Select Audio File(s)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold uppercase border border-red-500/30">
                Instant Offline Play
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Opens your device file manager / music folder directly in English.
            </p>
          </div>
          <button
            onClick={handleSelectFiles}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 active:scale-95 transition"
          >
            <FileAudio className="w-4 h-4" />
            <span>Select Song from Storage</span>
          </button>
        </div>

        {/* Drop & Selection Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mt-4 p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
            dragOver
              ? 'border-red-500 bg-red-500/10'
              : 'border-zinc-800 bg-zinc-950/60 hover:border-red-900/60'
          }`}
        >
          <div className="p-3 rounded-full bg-zinc-900 text-red-500 mb-2 shadow-inner border border-zinc-800">
            <Upload className="w-5 h-5 animate-bounce" />
          </div>
          <h3 className="text-xs font-semibold text-zinc-200">Drag & drop your local songs or folders here</h3>
          <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
            Parses ID3 tags, artist, album, and embedded album art locally. All song names are cleanly sanitized into English.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3">
            <button
              onClick={handleSelectFolder}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-200 font-medium text-xs border border-zinc-800 transition"
            >
              <FolderSearch className="w-3.5 h-3.5 text-red-500" />
              <span>Scan Entire Music Folder</span>
            </button>
          </div>
        </div>

        {/* Scanning status banner */}
        {statusMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs flex items-center gap-2.5">
            {isScanning ? (
              <Loader2 className="w-4 h-4 text-red-500 animate-spin shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="text-zinc-300 truncate">{statusMessage}</span>
          </div>
        )}

        {/* Scanned Items Preview List */}
        {scannedTracks.length > 0 && (
          <div className="mt-3 flex-1 overflow-y-auto min-h-[120px] max-h-[180px] border border-zinc-900 rounded-xl p-2 bg-black divide-y divide-zinc-900">
            <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex justify-between">
              <span>Ready for Import ({scannedTracks.length})</span>
              <span>Duration / Size</span>
            </div>
            {scannedTracks.map(({ track }, idx) => (
              <div key={idx} className="flex items-center justify-between px-2 py-1.5 hover:bg-zinc-900/50 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 text-[10px] font-bold uppercase border border-red-500/30">
                    {track.format}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{track.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{track.artist} • {track.album}</p>
                  </div>
                </div>
                <div className="text-right text-[11px] text-zinc-400 shrink-0 ml-3">
                  <div>{formatTime(track.duration)}</div>
                  <div className="text-[10px] text-zinc-500">{formatFileSize(track.fileSize)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Configuration Toggles */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoPlayImmediately}
              onChange={(e) => setAutoPlayImmediately(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
            />
            <span>Auto-play immediately when selected</span>
          </label>
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveToOfflineStorage}
              onChange={(e) => setSaveToOfflineStorage(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 accent-red-600 cursor-pointer"
            />
            <span>Persist to IndexedDB offline cache</span>
          </label>
        </div>

        {/* Actions Footer */}
        <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-900">
          <div className="text-xs text-zinc-400">
            {scannedTracks.length} song{scannedTracks.length !== 1 ? 's' : ''} loaded
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleConfirmImport(true)}
              disabled={scannedTracks.length === 0 || isScanning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-red-600/30 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Import & Play</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
