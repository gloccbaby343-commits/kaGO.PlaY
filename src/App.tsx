/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActiveTab, Playlist, RepeatMode, Track } from './types/audio';
import { generateDemoTracks } from './utils/audioSynthesizer';
import { storageService } from './services/storageService';
import { audioEngine, EQ_PRESETS } from './services/audioEngine';
import { getNextTrackIndex, getPreviousTrackIndex, generateShuffleIndices } from './utils/queueManager';
import { parseAudioFile, cleanFileName, hasCjkOrForeignGibberish } from './utils/id3Parser';
import { filterTracks } from './utils/playlistUtils';
import { hapticsService } from './services/hapticsService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { FullscreenPlayer } from './components/FullscreenPlayer';
import { EqualizerModal } from './components/EqualizerModal';
import { LocalFileScannerModal } from './components/LocalFileScannerModal';
import { PlaylistModal } from './components/PlaylistModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { ArchitectureGuideModal } from './components/ArchitectureGuideModal';
import { DashboardView } from './components/DashboardView';
import { SongsView } from './components/SongsView';
import { AlbumsView } from './components/AlbumsView';
import { ArtistsView } from './components/ArtistsView';
import { PlaylistsView } from './components/PlaylistsView';
import { AiStudioView } from './components/AiStudioView';
import { YouTubeStreamView } from './components/YouTubeStreamView';
import { youtubePlayerService } from './services/youtubePlayerService';
import { albumArtService } from './services/albumArtService';
import { sanitizeTrackToEnglish } from './utils/englishSanitizer';
import { parseLRC } from './utils/lrcParser';
import { WifiOff, Loader2, CheckCircle2, Zap } from 'lucide-react';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [recentTrackIds, setRecentTrackIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active View Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Playback State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffleIndices, setShuffleIndices] = useState<number[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Bass Boost & EQ State
  const [bassBoostEnabled, setBassBoostEnabled] = useState(false);
  const [bassBoostLevel, setBassBoostLevel] = useState(8);

  // Gapless & Crossfade State
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);
  const [gaplessEnabled, setGaplessEnabled] = useState(true);

  // Notifications & User Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isFullscreenPlayerOpen, setIsFullscreenPlayerOpen] = useState(false);
  const [fullscreenInitialView, setFullscreenInitialView] = useState<'turntable' | 'lyrics' | 'queue' | 'info'>('turntable');
  const [isEQOpen, setIsEQOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState<Track | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Offline detection
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Initial Data Hydration (Demo Tracks + Stored Tracks + Playlists) ---
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        // 1. Generate high-quality procedural demo tracks
        const demoTracks = await generateDemoTracks();

        // 2. Load stored custom tracks from IndexedDB
        const storedTracks = await storageService.getAllStoredTracks().catch(() => []);

        // 3. Load favorites
        const favs = await storageService.getFavoriteIds().catch(() => []);
        const favSet = new Set(favs);

        // 4. Load recent history
        const recents = await storageService.getRecentTrackIds().catch(() => []);

        // Merge all tracks, auto-healing any old legacy placeholder corruptions
        let allLoaded = [...storedTracks, ...demoTracks].map((t, idx) => {
          let healedTitle = t.title;
          let healedArtist = t.artist;
          if (
            healedTitle.toLowerCase().includes('english melody') ||
            healedTitle.toLowerCase().includes('melody english')
          ) {
            healedTitle = t.fileName ? cleanFileName(t.fileName).title : `Device Audio ${idx + 1}`;
          }
          if (
            healedArtist.toLowerCase().includes('english melody') ||
            healedArtist.toLowerCase().includes('melody english')
          ) {
            healedArtist = t.fileName ? cleanFileName(t.fileName).artist : 'Offline Audio';
          }
          return {
            ...t,
            title: healedTitle,
            artist: healedArtist,
            isFavorite: favSet.has(t.id) || t.isFavorite,
          };
        });

        // 5. Load playlists
        let pls = await storageService.getAllPlaylists().catch(() => []);
        if (pls.length === 0) {
          const defaultPl: Playlist = {
            id: 'pl_synth_favorites',
            name: 'Synthesizer Gems',
            description: 'Favorite ambient & retrowave tracks',
            trackIds: demoTracks.slice(0, 2).map((t) => t.id),
            color: 'from-red-600 to-rose-700',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          pls = [defaultPl];
          storageService.savePlaylist(defaultPl).catch(() => {});
        }

        // 6. Load saved settings
        const settings = await storageService.getSettings();
        if (settings) {
          if (typeof settings.volume === 'number') {
            setVolume(settings.volume);
            audioEngine.setVolume(settings.volume);
          }
          if (settings.repeatMode) setRepeatMode(settings.repeatMode);
          if (settings.isShuffle !== undefined) setIsShuffle(settings.isShuffle);
          if (settings.eqGains) {
            settings.eqGains.forEach((g, i) => audioEngine.setEqGain(i, g));
          }
          if (settings.bassBoost !== undefined) {
            setBassBoostLevel(settings.bassBoost);
            audioEngine.setBassBoost(settings.bassBoost);
          }
          if (settings.bassBoostEnabled !== undefined) {
            setBassBoostEnabled(settings.bassBoostEnabled);
            audioEngine.setBassBoostEnabled(settings.bassBoostEnabled);
          }
          if (settings.crossfadeDuration !== undefined) {
            setCrossfadeDuration(settings.crossfadeDuration);
            audioEngine.setCrossfadeDuration(settings.crossfadeDuration);
          }
          if (settings.gaplessEnabled !== undefined) {
            setGaplessEnabled(settings.gaplessEnabled);
            audioEngine.setGaplessEnabled(settings.gaplessEnabled);
          }
          if (settings.hapticsEnabled !== undefined) {
            hapticsService.setEnabled(settings.hapticsEnabled);
          }
        }


        if (mounted) {
          allLoaded = allLoaded.map((t, idx) => {
            if (
              hasCjkOrForeignGibberish(t.title) ||
              hasCjkOrForeignGibberish(t.artist) ||
              t.title.toLowerCase().includes('english melody')
            ) {
              const cleaned = cleanFileName(t.fileName || t.title);
              return {
                ...t,
                title: cleaned.title || `Offline Track ${idx + 1}`,
                artist: cleaned.artist !== 'Unknown Artist' ? cleaned.artist : 'Local Artist',
                album: hasCjkOrForeignGibberish(t.album) ? 'Device Storage' : t.album,
              };
            }
            return t;
          });

          setTracks(allLoaded);
          setPlaylists(pls);
          setFavoriteIds(favSet);
          setRecentTrackIds(recents);
          setQueue(allLoaded);
          setQueueIndex(0);
          setCurrentTrack(allLoaded[0] || null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // --- Next & Previous Track Handlers ---
  const handlePlayQueueIndex = useCallback(
    async (index: number, newQueue?: Track[]) => {
      const activeQ = newQueue || queue;
      if (index < 0 || index >= activeQ.length) return;
      const track = activeQ[index];
      if (!track) return;

      setQueueIndex(index);
      setCurrentTrack(track);
      if (newQueue) setQueue(newQueue);

      if (track.format === 'youtube' && track.youtubeId) {
        audioEngine.pause();
        youtubePlayerService.loadVideo(track.youtubeId, true);
        setIsPlaying(true);
      } else {
        youtubePlayerService.pause();
        await audioEngine.loadTrack(track, true);
      }
      storageService.addRecentTrack(track.id).catch(() => {});
      setRecentTrackIds((prev) => [track.id, ...prev.filter((id) => id !== track.id)].slice(0, 15));
    },
    [queue]
  );

  const handleNextTrack = useCallback(
    (isAutomatic = false) => {
      if (queue.length === 0) return;
      if (!isAutomatic) {
        hapticsService.trackChange();
      }
      const nextIdx = getNextTrackIndex(queueIndex, queue.length, repeatMode, isShuffle, shuffleIndices);
      if (nextIdx !== null) {
        handlePlayQueueIndex(nextIdx);
      } else if (!isAutomatic) {
        if (currentTrack?.format === 'youtube') {
          youtubePlayerService.seekTo(0);
        } else {
          audioEngine.seekTo(0);
        }
      } else {
        setIsPlaying(false);
      }
    },
    [queue, queueIndex, repeatMode, isShuffle, shuffleIndices, handlePlayQueueIndex, currentTrack]
  );

  const handlePreviousTrack = useCallback(() => {
    hapticsService.trackChange();
    if (currentTime > 3) {
      if (currentTrack?.format === 'youtube') {
        youtubePlayerService.seekTo(0);
      } else {
        audioEngine.seekTo(0);
      }
      return;
    }
    const prevIdx = getPreviousTrackIndex(queueIndex, queue.length, repeatMode, isShuffle, shuffleIndices);
    handlePlayQueueIndex(prevIdx);
  }, [currentTime, queueIndex, queue.length, repeatMode, isShuffle, shuffleIndices, handlePlayQueueIndex, currentTrack]);


  // --- Sync Upcoming Queue Track for Gapless Pre-Buffering & Crossfading ---
  useEffect(() => {
    if (!gaplessEnabled || queue.length === 0) {
      audioEngine.setNextTrack(null);
      return;
    }
    const nextIdx = getNextTrackIndex(queueIndex, queue.length, repeatMode, isShuffle, shuffleIndices);
    const nextTrack = nextIdx !== null ? queue[nextIdx] : null;
    audioEngine.setNextTrack(nextTrack);
  }, [queue, queueIndex, repeatMode, isShuffle, shuffleIndices, gaplessEnabled]);

  // --- Wire AudioEngine Callbacks & MediaSession ---
  useEffect(() => {
    audioEngine.onTimeUpdate = (time, dur) => {
      if (currentTrack?.format !== 'youtube') {
        setCurrentTime(time);
        setDuration(dur);
      }
    };

    audioEngine.onPlayStateChange = (playing) => {
      if (currentTrack?.format !== 'youtube') {
        setIsPlaying(playing);
      }
    };

    audioEngine.onEnded = () => {
      if (currentTrack?.format !== 'youtube') {
        handleNextTrack(true);
      }
    };

    audioEngine.onTrackAdvance = (nextTrack) => {
      const nextIdx = getNextTrackIndex(queueIndex, queue.length, repeatMode, isShuffle, shuffleIndices);
      if (nextIdx !== null) {
        setQueueIndex(nextIdx);
      }
      setCurrentTrack(nextTrack);
      storageService.addRecentTrack(nextTrack.id).catch(() => {});
      setRecentTrackIds((prev) => [nextTrack.id, ...prev.filter((id) => id !== nextTrack.id)].slice(0, 15));
    };

    audioEngine.setupMediaSessionHandlers({
      onPlay: () => {
        if (currentTrack?.format === 'youtube') {
          youtubePlayerService.play();
        } else {
          setIsPlaying(true);
        }
      },
      onPause: () => {
        if (currentTrack?.format === 'youtube') {
          youtubePlayerService.pause();
        } else {
          setIsPlaying(false);
        }
      },
      onPrevious: () => handlePreviousTrack(),
      onNext: () => handleNextTrack(),
      onSeekTo: (time) => {
        setCurrentTime(time);
        if (currentTrack?.format === 'youtube') {
          youtubePlayerService.seekTo(time);
        } else {
          audioEngine.seekTo(time);
        }
      },
    });
  }, [handleNextTrack, handlePreviousTrack, queueIndex, queue.length, repeatMode, isShuffle, shuffleIndices, currentTrack]);

  // --- Wire YouTube Player Service Listeners ---
  useEffect(() => {
    youtubePlayerService.onTimeUpdate = (curr, dur) => {
      if (currentTrack?.format === 'youtube') {
        setCurrentTime(curr);
        if (dur > 0) setDuration(dur);
      }
    };

    youtubePlayerService.onPlayStateChange = (playing) => {
      if (currentTrack?.format === 'youtube') {
        setIsPlaying(playing);
      }
    };

    youtubePlayerService.onEnded = () => {
      if (currentTrack?.format === 'youtube') {
        handleNextTrack(true);
      }
    };

    youtubePlayerService.onError = (msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    };
  }, [currentTrack, handleNextTrack]);

  // --- Controls Handlers ---
  const handleTogglePlayPause = () => {
    hapticsService.playPause();
    if (!currentTrack && tracks.length > 0) {
      handlePlayQueueIndex(0, tracks);
      return;
    }
    if (currentTrack?.format === 'youtube') {
      youtubePlayerService.togglePlayPause();
    } else {
      audioEngine.togglePlayPause();
    }
  };

  const handleSeek = (time: number) => {
    hapticsService.light();
    setCurrentTime(time);
    if (currentTrack?.format === 'youtube') {
      youtubePlayerService.seekTo(time);
    } else {
      audioEngine.seekTo(time);
    }
  };

  const handleSetVolume = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    audioEngine.setVolume(vol);
    audioEngine.setMute(false);
    youtubePlayerService.setVolume(vol);
    youtubePlayerService.setMute(false);
  };

  const handleToggleMute = () => {
    hapticsService.light();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMute(nextMuted);
    youtubePlayerService.setMute(nextMuted);
  };

  const handleToggleRepeat = () => {
    hapticsService.light();
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const handleToggleShuffle = () => {
    hapticsService.light();
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    if (nextShuffle) {
      const generated = generateShuffleIndices(queue.length, queueIndex);
      setShuffleIndices(generated);
    }
  };

  // --- Bass Boost Toggle ---
  const handleToggleBassBoost = () => {
    const next = !bassBoostEnabled;
    setBassBoostEnabled(next);
    audioEngine.setBassBoostEnabled(next);
    if (next) {
      hapticsService.bassImpact();
    } else {
      hapticsService.light();
    }

    setToastMessage(`Bass Boost ${next ? 'Activated (+8 dB)' : 'Disabled'}`);
    setTimeout(() => setToastMessage(null), 2500);

    storageService.saveSettings({
      volume,
      isMuted,
      repeatMode,
      isShuffle,
      eqPreset: 'Custom',
      eqGains: audioEngine.getEqGains(),
      bassBoost: bassBoostLevel,
      bassBoostEnabled: next,
      hapticsEnabled: hapticsService.isEnabled(),
    }).catch(() => {});
  };

  const handleToggleFavorite = async (target?: string | Track) => {
    hapticsService.favorite();
    let id: string | undefined;
    let trackObj: Track | undefined;
    if (typeof target === 'string') {
      id = target;
    } else if (target && typeof target === 'object') {
      id = target.id;
      trackObj = target;
    } else {
      id = currentTrack?.id;
      trackObj = currentTrack || undefined;
    }
    if (!id) return;

    const isFav = favoriteIds.has(id);
    const nextFav = !isFav;


    const updated = new Set(favoriteIds);
    if (nextFav) {
      updated.add(id);
    } else {
      updated.delete(id);
    }
    setFavoriteIds(updated);

    if (trackObj && !tracks.some((t) => t.id === id)) {
      setTracks((prev) => [{ ...trackObj!, isFavorite: nextFav }, ...prev]);
    } else {
      setTracks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isFavorite: nextFav } : t))
      );
    }

    if (currentTrack?.id === id) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: nextFav } : null));
    }

    await storageService.toggleFavorite(id, nextFav);
  };

  // --- Direct Pick and Play Offline Audio File from User Storage ---
  const handlePickAndPlayFile = async (file: File) => {
    try {
      setToastMessage(`Reading "${file.name}"...`);
      const track = await parseAudioFile(file);
      await storageService.saveTrack(track, file);

      setTracks((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
      const newQueue = [track, ...queue.filter((t) => t.id !== track.id)];
      setQueue(newQueue);
      setQueueIndex(0);
      setCurrentTrack(track);

      await audioEngine.loadTrack(track, true);
      setIsPlaying(true);
      storageService.addRecentTrack(track.id).catch(() => {});
      setRecentTrackIds((prev) => [track.id, ...prev.filter((id) => id !== track.id)].slice(0, 15));

      setToastMessage(`Playing offline: "${track.title}"`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Failed to load local audio file:', err);
      setToastMessage(`Error reading ${file.name}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // --- Rename Track Metadata (Title & Artist) ---
  const handleRenameTrack = async (id: string, newTitle: string, newArtist: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle, artist: newArtist } : t))
    );
    setQueue((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle, artist: newArtist } : t))
    );
    if (currentTrack?.id === id) {
      setCurrentTrack((prev) => (prev ? { ...prev, title: newTitle, artist: newArtist } : null));
    }
    await storageService.updateTrackMetadata(id, { title: newTitle, artist: newArtist }).catch(() => {});
    setToastMessage(`Renamed song to "${newTitle}"`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Fetch or Generate Unique Visualizer Album Art via Gemini API ---
  const handleGenerateAlbumArt = async (track: Track, preferAi = false) => {
    try {
      setToastMessage(`Analyzing "${track.title}" with Gemini AI...`);
      const result = await albumArtService.fetchOrGenerateAlbumArt(track, preferAi);
      if (result.coverArtUrl) {
        const updatedTrack: Track = { ...track, coverArtUrl: result.coverArtUrl };
        await storageService.updateTrackMetadata(track.id, { coverArtUrl: result.coverArtUrl }).catch(() => {});

        setTracks((prev) => prev.map((t) => (t.id === track.id ? updatedTrack : t)));
        setQueue((prev) => prev.map((t) => (t.id === track.id ? updatedTrack : t)));
        if (currentTrack?.id === track.id) {
          setCurrentTrack(updatedTrack);
        }

        const sourceLabel =
          result.source === 'gemini-api'
            ? 'Gemini AI Visualizer'
            : result.source === 'itunes'
            ? 'Official Cover'
            : 'Custom Visualizer';
        setToastMessage(`Album art generated for "${track.title}" (${sourceLabel})`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Failed to generate album art:', err);
      setToastMessage(`Could not generate album art for "${track.title}"`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleBatchGenerateAlbumArt = async () => {
    const missing = tracks.filter((t) => !t.coverArtUrl || t.coverArtUrl.startsWith('blob:'));
    if (missing.length === 0) {
      setToastMessage('All songs in your library already have album art!');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    setToastMessage(`Generating AI visualizer art for ${missing.length} track${missing.length > 1 ? 's' : ''}...`);
    let count = 0;
    for (const t of missing) {
      try {
        const res = await albumArtService.fetchOrGenerateAlbumArt(t, false);
        if (res.coverArtUrl) {
          await storageService.updateTrackMetadata(t.id, { coverArtUrl: res.coverArtUrl }).catch(() => {});
          setTracks((prev) => prev.map((item) => (item.id === t.id ? { ...item, coverArtUrl: res.coverArtUrl } : item)));
          setQueue((prev) => prev.map((item) => (item.id === t.id ? { ...item, coverArtUrl: res.coverArtUrl } : item)));
          if (currentTrack?.id === t.id) {
            setCurrentTrack((prev) => (prev ? { ...prev, coverArtUrl: res.coverArtUrl } : null));
          }
          count++;
        }
      } catch {
        // continue batch
      }
    }
    setToastMessage(`Generated visualizer art for ${count} songs!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- Attach & Save Synchronized LRC Lyrics ---
  const handleAttachLrc = async (trackId: string, file: File) => {
    try {
      const lrcText = await file.text();
      await handleSaveLrcText(trackId, lrcText, file.name);
    } catch (err) {
      console.error('Failed to attach LRC file:', err);
      setToastMessage('Could not read .LRC file');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSaveLrcText = async (trackId: string, lrcText: string, fileName?: string) => {
    const parsed = parseLRC(lrcText);
    const updatedMetadata = {
      syncedLyrics: lrcText,
      lrcContent: lrcText,
      lrcFileName: fileName || 'custom.lrc',
      hasSyncedLyrics: parsed.lines.length > 0,
    };

    await storageService.updateTrackMetadata(trackId, updatedMetadata).catch(() => {});

    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updatedMetadata } : t))
    );
    setQueue((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updatedMetadata } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, ...updatedMetadata } : null));
    }

    setToastMessage(`Saved synchronized LRC lyrics (${parsed.lines.length} lines)`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateLrcOffset = async (trackId: string, offset: number) => {
    await storageService.updateTrackMetadata(trackId, { lrcOffset: offset }).catch(() => {});
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, lrcOffset: offset } : t))
    );
    setQueue((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, lrcOffset: offset } : t))
    );
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, lrcOffset: offset } : null));
    }
  };

  // --- Clear / Heal Corrupted Tracks with Gibberish or Legacy Placeholder Names ---
  const handleClearCorruptedTracks = async () => {
    const corrupted = tracks.filter(
      (t) =>
        t.title.toLowerCase().includes('english melody') ||
        t.title.toLowerCase().includes('melody english') ||
        hasCjkOrForeignGibberish(t.title) ||
        hasCjkOrForeignGibberish(t.artist)
    );

    if (corrupted.length === 0) return;

    for (const t of corrupted) {
      if (t.fileName && !t.fileName.toLowerCase().includes('english_melody')) {
        const cleaned = cleanFileName(t.fileName);
        await storageService.updateTrackMetadata(t.id, {
          title: cleaned.title,
          artist: cleaned.artist !== 'Unknown Artist' ? cleaned.artist : 'Local Artist',
          album: 'Device Storage',
        }).catch(() => {});
      } else {
        await storageService.deleteTrack(t.id).catch(() => {});
      }
    }

    setTracks((prev) =>
      prev
        .filter((t) => !t.title.toLowerCase().includes('english melody'))
        .map((t) => {
          if (hasCjkOrForeignGibberish(t.title) || hasCjkOrForeignGibberish(t.artist)) {
            const cleaned = cleanFileName(t.fileName || t.title);
            return { ...t, title: cleaned.title, artist: cleaned.artist !== 'Unknown Artist' ? cleaned.artist : 'Local Artist' };
          }
          return t;
        })
    );
    setQueue((prev) =>
      prev
        .filter((t) => !t.title.toLowerCase().includes('english melody'))
        .map((t) => {
          if (hasCjkOrForeignGibberish(t.title) || hasCjkOrForeignGibberish(t.artist)) {
            const cleaned = cleanFileName(t.fileName || t.title);
            return { ...t, title: cleaned.title, artist: cleaned.artist !== 'Unknown Artist' ? cleaned.artist : 'Local Artist' };
          }
          return t;
        })
    );
    if (currentTrack && (hasCjkOrForeignGibberish(currentTrack.title) || currentTrack.title.toLowerCase().includes('english melody'))) {
      const cleaned = cleanFileName(currentTrack.fileName || currentTrack.title);
      setCurrentTrack((prev) => (prev ? { ...prev, title: cleaned.title, artist: cleaned.artist !== 'Unknown Artist' ? cleaned.artist : 'Local Artist' } : null));
    }
    setToastMessage(`Fixed and cleaned song names!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // --- Play Track Trigger from Any View ---
  const handlePlayTrack = (track: Track, newQueue?: Track[]) => {
    hapticsService.trackChange();
    let targetQueue = newQueue || queue;
    let targetIndex = targetQueue.findIndex((t) => t.id === track.id);
    if (targetIndex === -1) {
      targetQueue = [track, ...targetQueue];
      targetIndex = 0;
    }
    if (isShuffle) {
      const generated = generateShuffleIndices(targetQueue.length, targetIndex);
      setShuffleIndices(generated);
    }
    handlePlayQueueIndex(targetIndex, targetQueue);
  };

  const handleShuffleAll = () => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    handlePlayTrack(shuffled[0], shuffled);
  };

  // --- Local File Scanner Batch Import ---
  const handleImportTracks = async (newTracks: Track[], rawFiles?: File[], autoPlay = true) => {
    for (let i = 0; i < newTracks.length; i++) {
      const track = newTracks[i];
      const rawFile = rawFiles ? rawFiles[i] : undefined;
      await storageService.saveTrack(track, rawFile);
    }

    setTracks((prev) => [...newTracks, ...prev]);
    const updatedQueue = [...newTracks, ...queue];
    setQueue(updatedQueue);

    if (autoPlay && newTracks.length > 0) {
      handlePlayTrack(newTracks[0], updatedQueue);
      setToastMessage(`Playing offline: "${newTracks[0].title}"`);
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      setToastMessage(`Added ${newTracks.length} song${newTracks.length !== 1 ? 's' : ''} to library`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // --- Upload Music Folder from Device Storage ---
  const handleUploadFolder = async (files: File[], explicitFolderName?: string) => {
    try {
      const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
      const audioFiles = files.filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || '';
        return f.type.startsWith('audio/') || audioExtensions.includes(ext);
      });

      if (audioFiles.length === 0) {
        setToastMessage('No supported audio files found in selected folder');
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      let folderName = explicitFolderName;
      if (!folderName) {
        const rel = (audioFiles[0] as any)?.webkitRelativePath || '';
        if (rel && rel.includes('/')) {
          folderName = rel.split('/')[0];
        }
      }
      folderName = folderName || 'Uploaded Folder';

      setToastMessage(`Reading ${audioFiles.length} songs from folder "${folderName}"...`);

      const lrcFiles = files.filter((f) => f.name.toLowerCase().endsWith('.lrc'));

      const parsedTracks: Track[] = [];
      for (const file of audioFiles) {
        try {
          // Check if there is a matching .lrc file in the same folder
          const baseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
          const matchingLrc = lrcFiles.find((lf) => {
            const lrcBase = lf.name.replace(/\.[^/.]+$/, '').toLowerCase().trim();
            return lrcBase === baseName || lf.name.toLowerCase().startsWith(baseName);
          });

          let lrcContent: string | undefined;
          let lrcFileName: string | undefined;
          if (matchingLrc) {
            try {
              lrcContent = await matchingLrc.text();
              lrcFileName = matchingLrc.name;
            } catch {
              // ignore
            }
          }

          const track = await parseAudioFile(file, folderName, lrcContent, lrcFileName);
          await storageService.saveTrack(track, file);
          parsedTracks.push(track);
        } catch (err) {
          console.warn('Failed to parse file:', file.name, err);
        }
      }

      if (parsedTracks.length > 0) {
        setTracks((prev) => [...parsedTracks, ...prev.filter((t) => !parsedTracks.some((pt) => pt.id === t.id))]);
        setQueue((prev) => [...parsedTracks, ...prev]);
        setToastMessage(`Uploaded folder "${folderName}" (${parsedTracks.length} songs)`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Failed to upload folder:', err);
      setToastMessage('Error reading music folder');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    const toDelete = tracks.filter((t) => t.folderName === folderName);
    for (const t of toDelete) {
      await storageService.deleteTrack(t.id).catch(() => {});
    }
    setTracks((prev) => prev.filter((t) => t.folderName !== folderName));
    setQueue((prev) => prev.filter((t) => t.folderName !== folderName));
    if (currentTrack?.folderName === folderName) {
      handleNextTrack();
    }
    setToastMessage(`Removed folder "${folderName}" from library`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteTrack = async (id: string) => {
    await storageService.deleteTrack(id);
    setTracks((prev) => prev.filter((t) => t.id !== id));
    setQueue((prev) => prev.filter((t) => t.id !== id));
    if (currentTrack?.id === id) {
      handleNextTrack();
    }
  };

  // --- Playlist Actions ---
  const handleSavePlaylist = async (playlist: Playlist) => {
    await storageService.savePlaylist(playlist);
    setPlaylists((prev) => {
      const idx = prev.findIndex((p) => p.id === playlist.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = playlist;
        return copy;
      }
      return [...prev, playlist];
    });
  };

  const handleDeletePlaylist = async (id: string) => {
    await storageService.deletePlaylist(id);
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleTrackInPlaylist = async (playlistId: string, trackId: string) => {
    const targetPl = playlists.find((p) => p.id === playlistId);
    if (!targetPl) return;

    const hasTrack = targetPl.trackIds.includes(trackId);
    const updatedIds = hasTrack
      ? targetPl.trackIds.filter((id) => id !== trackId)
      : [...targetPl.trackIds, trackId];

    const updatedPl = { ...targetPl, trackIds: updatedIds, updatedAt: Date.now() };
    await handleSavePlaylist(updatedPl);
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    handleToggleTrackInPlaylist(playlistId, trackId);
  };

  const handleQuickCreatePlaylist = async (name: string) => {
    const newPl: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      description: '',
      trackIds: trackToAddToPlaylist ? [trackToAddToPlaylist.id] : [],
      color: 'from-cyan-500 to-blue-600',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await handleSavePlaylist(newPl);
    setTrackToAddToPlaylist(null);
  };

  // --- Filtered Views Derived Data ---
  const filteredTracks = useMemo(() => {
    return filterTracks(tracks, searchQuery);
  }, [tracks, searchQuery]);

  const recentTracks = useMemo(() => {
    return recentTrackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is Track => t !== undefined);
  }, [recentTrackIds, tracks]);

  const favoriteTracks = useMemo(() => {
    return tracks.filter((t) => favoriteIds.has(t.id));
  }, [tracks, favoriteIds]);

  return (
    <div className="flex h-screen bg-[#0c0c0e] text-[#f2efeb] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        trackCount={tracks.length}
        playlistCount={playlists.length}
        favoriteCount={favoriteIds.size}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenEQ={() => setIsEQOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onPickAndPlayFile={handlePickAndPlayFile}
          bassBoostEnabled={bassBoostEnabled}
          onSearchYouTube={(query) => {
            setActiveTab('youtube');
          }}
        />

        {/* Offline indicator banner */}
        {!isOnline && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium text-amber-300">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Device is offline — Playing local audio library smoothly</span>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-sm bg-[#16161a] border border-[#ff3e3e]/40 text-[#f2efeb] text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#ff3e3e] shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Scrollable Viewport with Variation 2 background */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#111115] to-[#0c0c0e] pt-safe-top pb-safe-bottom pb-[calc(10rem+max(env(safe-area-inset-bottom,0px),1rem))]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <p className="text-xs">Initializing local audio engine & database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  tracks={filteredTracks}
                  recentTracks={recentTracks}
                  favoriteTracks={favoriteTracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayTrack={handlePlayTrack}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onOpenEQ={() => setIsEQOpen(true)}
                  onOpenGuide={() => setIsGuideOpen(true)}
                  onPickAndPlayFile={handlePickAndPlayFile}
                  bassBoostEnabled={bassBoostEnabled}
                  onToggleBassBoost={handleToggleBassBoost}
                />
              )}

              {activeTab === 'songs' && (
                <SongsView
                  tracks={filteredTracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayTrack={handlePlayTrack}
                  onShuffleAll={handleShuffleAll}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
                  onDeleteTrack={handleDeleteTrack}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onPickAndPlayFile={handlePickAndPlayFile}
                  onRenameTrack={handleRenameTrack}
                  onClearCorruptedTracks={handleClearCorruptedTracks}
                  onUploadFolder={handleUploadFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onGenerateAlbumArt={handleGenerateAlbumArt}
                  onBatchGenerateAlbumArt={handleBatchGenerateAlbumArt}
                />
              )}

              {activeTab === 'albums' && (
                <AlbumsView tracks={filteredTracks} onPlayTrack={handlePlayTrack} />
              )}

              {activeTab === 'artists' && (
                <ArtistsView tracks={filteredTracks} onPlayTrack={handlePlayTrack} />
              )}

              {activeTab === 'playlists' && (
                <PlaylistsView
                  playlists={playlists}
                  allTracks={tracks}
                  onPlayTrack={handlePlayTrack}
                  onOpenCreatePlaylist={() => {
                    setPlaylistToEdit(null);
                    setIsPlaylistModalOpen(true);
                  }}
                  onEditPlaylist={(pl) => {
                    setPlaylistToEdit(pl);
                    setIsPlaylistModalOpen(true);
                  }}
                  onDeletePlaylist={handleDeletePlaylist}
                  onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                />
              )}

              {activeTab === 'favorites' && (
                <SongsView
                  tracks={favoriteTracks}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayTrack={handlePlayTrack}
                  onShuffleAll={() => {
                    const shuffled = [...favoriteTracks].sort(() => Math.random() - 0.5);
                    handlePlayTrack(shuffled[0], shuffled);
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
                  onDeleteTrack={handleDeleteTrack}
                  onOpenScanner={() => setIsScannerOpen(true)}
                  onPickAndPlayFile={handlePickAndPlayFile}
                  onRenameTrack={handleRenameTrack}
                  onClearCorruptedTracks={handleClearCorruptedTracks}
                />
              )}

              {activeTab === 'ai_studio' && (
                <AiStudioView
                  onPlayGeneratedTrack={(track: Track) => handlePlayTrack(track)}
                  onAddGeneratedTrackToLibrary={(track: Track, blob: Blob) => {
                    const clean = sanitizeTrackToEnglish(track);
                    setTracks((prev) => [clean, ...prev]);
                    storageService.saveTrack(clean, blob).catch(() => {});
                    setToastMessage(`Added "${clean.title}" to library`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                />
              )}

              {activeTab === 'youtube' && (
                <YouTubeStreamView
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayTrack={handlePlayTrack}
                  onAddToQueue={(track) => {
                    setQueue((prev) => [...prev, track]);
                    setToastMessage(`Added "${track.title}" to queue`);
                    setTimeout(() => setToastMessage(null), 2500);
                  }}
                  onOpenAddToPlaylist={(track) => setTrackToAddToPlaylist(track)}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteIds={favoriteIds}
                />
              )}

              {activeTab === 'architecture' && (
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-zinc-100">Engineering Blueprints</h2>
                    <button
                      onClick={() => setIsGuideOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition active:scale-95"
                    >
                      Open Full Screen Specs
                    </button>
                  </div>
                  <div className="p-6 rounded-2xl bg-black border border-zinc-900 space-y-4 text-xs sm:text-sm text-zinc-300">
                    <p className="leading-relaxed">
                      AuraWave is built to demonstrate both a production <strong>Progressive Web App</strong> (using Web Audio API, MediaSession, and IndexedDB) and the native mobile architecture for <strong>Flutter</strong> and <strong>React Native TrackPlayer</strong>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900">
                        <h4 className="font-bold text-red-400 mb-1">Background Audio & Lock Screen</h4>
                        <p className="text-xs text-zinc-400">
                          In PWA, <code className="text-red-300">navigator.mediaSession</code> binds native Android/iOS lock screen controls and headphone hardware buttons. In Flutter, <code className="text-red-300">audio_service</code> binds to Android's <code className="text-red-300">MediaBrowserService</code>.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900">
                        <h4 className="font-bold text-red-400 mb-1">Local Storage Permissions</h4>
                        <p className="text-xs text-zinc-400">
                          Android 13+ requires <code className="text-red-300">READ_MEDIA_AUDIO</code> instead of legacy <code className="text-red-300">READ_EXTERNAL_STORAGE</code>. The scanner parses ID3 tags and embedded APIC artwork client-side.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Mini Player Sticky Bar */}
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          isFavorite={currentTrack ? favoriteIds.has(currentTrack.id) : false}
          onTogglePlayPause={handleTogglePlayPause}
          onNext={() => handleNextTrack()}
          onPrevious={handlePreviousTrack}
          onSeekBackward10={() => handleSeek(Math.max(0, currentTime - 10))}
          onSeekForward10={() => handleSeek(Math.min(duration || Infinity, currentTime + 10))}
          onToggleFavorite={() => handleToggleFavorite()}
          onExpand={() => {
            setFullscreenInitialView('turntable');
            setIsFullscreenPlayerOpen(true);
          }}
          onOpenLyrics={() => {
            setFullscreenInitialView('lyrics');
            setIsFullscreenPlayerOpen(true);
          }}
          onOpenEQ={() => setIsEQOpen(true)}
          onSeek={handleSeek}
          queueLength={queue.length}
          engineMode={gaplessEnabled ? (crossfadeDuration > 0 ? `X-FADE ${crossfadeDuration}s` : 'GAPLESS') : 'STANDARD'}
        />

        {/* Mobile Bottom Navigation */}
        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      </div>

      {/* Fullscreen Player Modal with Vinyl Turntable, Visualizer, Lyrics & Quick Bass Boost */}
      <FullscreenPlayer
        isOpen={isFullscreenPlayerOpen}
        initialView={fullscreenInitialView}
        onClose={() => setIsFullscreenPlayerOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        queue={queue}
        queueIndex={queueIndex}
        isFavorite={currentTrack ? favoriteIds.has(currentTrack.id) : false}
        onTogglePlayPause={handleTogglePlayPause}
        onNext={() => handleNextTrack()}
        onPrevious={handlePreviousTrack}
        onSeek={handleSeek}
        onSetVolume={handleSetVolume}
        onToggleMute={handleToggleMute}
        onToggleRepeat={handleToggleRepeat}
        onToggleShuffle={handleToggleShuffle}
        onToggleFavorite={() => handleToggleFavorite()}
        onOpenEQ={() => setIsEQOpen(true)}
        onOpenAddToPlaylist={() => {
          if (currentTrack) setTrackToAddToPlaylist(currentTrack);
        }}
        onSelectQueueTrack={(index) => handlePlayQueueIndex(index)}
        onRemoveFromQueue={(index) => {
          setQueue((prev) => prev.filter((_, i) => i !== index));
        }}
        bassBoostEnabled={bassBoostEnabled}
        onToggleBassBoost={handleToggleBassBoost}
        onGenerateAlbumArt={handleGenerateAlbumArt}
        onAttachLrc={handleAttachLrc}
        onSaveLrcText={handleSaveLrcText}
        onUpdateOffset={handleUpdateLrcOffset}
      />

      {/* 5-Band Equalizer Modal with Rock, Pop, Classical, Jazz & Toggleable Bass Boost */}
      <EqualizerModal
        isOpen={isEQOpen}
        onClose={() => setIsEQOpen(false)}
        onSave={(presetName, gains, bass, bassEnabled, crossfade, gapless, haptics) => {
          setBassBoostEnabled(bassEnabled);
          setBassBoostLevel(bass);
          if (crossfade !== undefined) setCrossfadeDuration(crossfade);
          if (gapless !== undefined) setGaplessEnabled(gapless);
          if (haptics !== undefined) hapticsService.setEnabled(haptics);
          storageService.saveSettings({
            volume,
            isMuted,
            repeatMode,
            isShuffle,
            eqPreset: presetName,
            eqGains: gains,
            bassBoost: bass,
            bassBoostEnabled: bassEnabled,
            crossfadeDuration: crossfade ?? crossfadeDuration,
            gaplessEnabled: gapless ?? gaplessEnabled,
            hapticsEnabled: haptics ?? hapticsService.isEnabled(),
          }).catch(() => {});
        }}

      />

      {/* Local File & Folder Scanner Modal */}
      <LocalFileScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onImportTracks={handleImportTracks}
      />

      {/* Playlist Create/Edit Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        playlistToEdit={playlistToEdit}
        onSave={handleSavePlaylist}
        onDelete={handleDeletePlaylist}
      />

      {/* Add Track to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={!!trackToAddToPlaylist}
        onClose={() => setTrackToAddToPlaylist(null)}
        track={trackToAddToPlaylist}
        playlists={playlists}
        onToggleTrackInPlaylist={handleToggleTrackInPlaylist}
        onCreateNewPlaylist={handleQuickCreatePlaylist}
      />

      {/* Architecture & Engineering Guide Modal */}
      <ArchitectureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
