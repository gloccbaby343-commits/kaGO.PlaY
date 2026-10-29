import { EqualizerBand, EqualizerPreset, Track, PlaybackSettings } from '../types/audio';

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];

export const EQ_PRESETS: EqualizerPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0], bassBoost: 8, bassBoostEnabled: false },
  { name: 'Bass', gains: [7, 5, 1, 0, 0], bassBoost: 8, bassBoostEnabled: true },
  { name: 'Heavy Bass', gains: [11, 8, 2, -1, -2], bassBoost: 12, bassBoostEnabled: true },
  { name: 'Rock', gains: [5, 3, -1, 3, 5], bassBoostEnabled: false },
  { name: 'Pop', gains: [-1, 2, 5, 2, -2], bassBoostEnabled: false },
  { name: 'Classical', gains: [4, 3, 2, 2, -1], bassBoostEnabled: false },
  { name: 'Jazz', gains: [3, 2, -1, 2, 4], bassBoostEnabled: false },
  { name: 'Electronic', gains: [5, 3, 0, 2, 4], bassBoost: 6, bassBoostEnabled: true },
  { name: 'Hip-Hop', gains: [6, 4, 1, 2, 3], bassBoost: 8, bassBoostEnabled: true },
  { name: 'Vocal Boost', gains: [-2, 1, 5, 3, -1], bassBoostEnabled: false },
  { name: 'Acoustic', gains: [3, 2, 1, 3, 3], bassBoostEnabled: false },
  { name: 'Treble Boost', gains: [-2, -1, 1, 4, 6], bassBoostEnabled: false },
];

interface AudioChannel {
  index: 0 | 1;
  audio: HTMLAudioElement;
  sourceNode: MediaElementAudioSourceNode | null;
  gainNode: GainNode | null;
  track: Track | null;
}

export class AudioEngine {
  // Dual-channel audio architecture for gapless & crossfade playback
  private channels: [AudioChannel, AudioChannel];
  private activeChannelIndex: 0 | 1 = 0;

  // Web Audio Graph
  private audioCtx: AudioContext | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassFilter: BiquadFilterNode | null = null;
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isInitialized = false;

  // Gapless & Crossfade Configuration
  private isGaplessEnabled: boolean = true;
  private crossfadeDuration: number = 3; // in seconds (0 = gapless cut, 1..12 = crossfade)
  private nextQueuedTrack: Track | null = null;
  private isTransitioning: boolean = false;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  // DSP and Master State
  private masterVolume: number = 0.8;
  private isMutedState: boolean = false;
  private currentTrack: Track | null = null;
  private currentGains: number[] = [0, 0, 0, 0, 0];
  private currentBassBoost: number = 8;
  private isBassBoostEnabled: boolean = false;

  // Callbacks
  public onTimeUpdate?: (currentTime: number, duration: number) => void;
  public onEnded?: () => void;
  public onPlayStateChange?: (isPlaying: boolean) => void;
  public onTrackChange?: (track: Track) => void;
  public onTrackAdvance?: (track: Track) => void;
  public onCrossfadeStart?: (incomingTrack: Track, duration: number) => void;
  public onPreviousRequest?: () => void;
  public onNextRequest?: () => void;
  public onError?: (msg: string) => void;

  constructor() {
    const audioA = new Audio();
    const audioB = new Audio();
    audioA.preload = 'auto';
    audioB.preload = 'auto';

    this.channels = [
      { index: 0, audio: audioA, sourceNode: null, gainNode: null, track: null },
      { index: 1, audio: audioB, sourceNode: null, gainNode: null, track: null },
    ];

    this.setupChannelListeners(this.channels[0]);
    this.setupChannelListeners(this.channels[1]);
  }

  private get active(): AudioChannel {
    return this.channels[this.activeChannelIndex];
  }

  private get standby(): AudioChannel {
    return this.channels[(1 - this.activeChannelIndex) as 0 | 1];
  }

  private setupChannelListeners(ch: AudioChannel) {
    ch.audio.addEventListener('timeupdate', () => {
      if (ch.index === this.activeChannelIndex) {
        const dur = ch.audio.duration;
        const curr = ch.audio.currentTime;
        if (this.onTimeUpdate && !isNaN(dur) && isFinite(dur)) {
          this.onTimeUpdate(curr, dur);
          this.updateMediaSessionPosition();
        }
        this.checkTransitionThreshold(curr, dur);
      }
    });

    ch.audio.addEventListener('play', () => {
      if (ch.index === this.activeChannelIndex) {
        this.onPlayStateChange?.(true);
        this.updateMediaSessionPlaybackState('playing');
      }
    });

    ch.audio.addEventListener('pause', () => {
      if (ch.index === this.activeChannelIndex && !this.isTransitioning) {
        this.onPlayStateChange?.(false);
        this.updateMediaSessionPlaybackState('paused');
      }
    });

    ch.audio.addEventListener('ended', () => {
      if (ch.index === this.activeChannelIndex && !this.isTransitioning) {
        this.onEnded?.();
      }
    });

    ch.audio.addEventListener('error', (e) => {
      if (ch.index === this.activeChannelIndex) {
        console.error(`Audio playback error on channel ${ch.index}:`, e);
        this.onError?.('Playback error encountered on track');
      }
    });
  }

  private initWebAudio() {
    if (this.isInitialized) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // 1. Bass boost filter (lowshelf at 80Hz)
      this.bassFilter = this.audioCtx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 80;
      this.bassFilter.gain.value = this.isBassBoostEnabled ? this.currentBassBoost : 0;

      // 2. 5-band EQ filters
      this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.0;
        }
        filter.frequency.value = freq;
        filter.gain.value = this.currentGains[index] || 0;
        return filter;
      });

      // 3. Master Gain Node
      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.value = this.isMutedState ? 0 : this.masterVolume;

      // 4. Analyser Node for real-time visualization
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // 5. Connect DSP Chain: Bass -> EQ[0..4] -> Master Gain -> Analyser -> Destination
      let lastDspNode: AudioNode = this.bassFilter;
      for (const eqFilter of this.eqFilters) {
        lastDspNode.connect(eqFilter);
        lastDspNode = eqFilter;
      }
      lastDspNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);

      // 6. Connect Dual Channels into Bass Filter
      for (let i = 0; i < 2; i++) {
        const ch = this.channels[i];
        ch.sourceNode = this.audioCtx.createMediaElementSource(ch.audio);
        ch.gainNode = this.audioCtx.createGain();
        ch.gainNode.gain.value = i === this.activeChannelIndex ? 1.0 : 0.0;
        ch.sourceNode.connect(ch.gainNode);
        ch.gainNode.connect(this.bassFilter);
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio initialization fallback:', err);
    }
  }

  public async resumeAudioContext() {
    this.initWebAudio();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  // --- Gapless & Crossfade Management ---
  public setNextTrack(track: Track | null): void {
    this.nextQueuedTrack = track;
    if (!track || !this.isGaplessEnabled) {
      if (this.standby.track && !this.isTransitioning) {
        this.standby.audio.removeAttribute('src');
        this.standby.audio.load();
        this.standby.track = null;
      }
      return;
    }

    this.prepareStandbyChannel(track);
  }

  private prepareStandbyChannel(track: Track) {
    const standby = this.standby;
    if (standby.track?.id === track.id && standby.audio.src) {
      return; // Already prepped
    }

    standby.track = track;
    standby.audio.src = track.url;
    standby.audio.preload = 'auto';
    standby.audio.load();

    if (standby.gainNode) {
      standby.gainNode.gain.value = 0;
    } else {
      standby.audio.volume = 0;
    }
  }

  private checkTransitionThreshold(curr: number, dur: number) {
    if (
      !this.isGaplessEnabled ||
      !this.nextQueuedTrack ||
      this.isTransitioning ||
      isNaN(dur) ||
      !isFinite(dur) ||
      dur < 2
    ) {
      return;
    }

    const standby = this.standby;
    if (!standby.track || standby.track.id !== this.nextQueuedTrack.id || !standby.audio.src) {
      this.prepareStandbyChannel(this.nextQueuedTrack);
    }

    // Limit crossfade duration so short songs don't start fading out too early
    const maxAllowedFade = Math.max(0, dur * 0.35);
    const effectiveFade = Math.min(this.crossfadeDuration, maxAllowedFade);

    if (effectiveFade >= 0.5) {
      // Crossfade mode
      const triggerTime = dur - effectiveFade;
      if (curr >= triggerTime && triggerTime > 0.5) {
        this.startCrossfadeTransition(this.nextQueuedTrack, effectiveFade);
      }
    } else {
      // Pure gapless mode: start upcoming track 0.08s before active track finishes
      const triggerTime = Math.max(0, dur - 0.08);
      if (curr >= triggerTime) {
        this.startGaplessHandoff(this.nextQueuedTrack);
      }
    }
  }

  private async startCrossfadeTransition(nextTrack: Track, duration: number) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const outgoing = this.active;
    const incoming = this.standby;

    this.onCrossfadeStart?.(nextTrack, duration);

    try {
      await this.resumeAudioContext();
      incoming.audio.currentTime = 0;

      if (this.audioCtx && incoming.gainNode && outgoing.gainNode) {
        const now = this.audioCtx.currentTime;
        incoming.gainNode.gain.cancelScheduledValues(now);
        incoming.gainNode.gain.setValueAtTime(0.0001, now);
        incoming.gainNode.gain.linearRampToValueAtTime(1.0, now + duration);

        outgoing.gainNode.gain.cancelScheduledValues(now);
        outgoing.gainNode.gain.setValueAtTime(outgoing.gainNode.gain.value, now);
        outgoing.gainNode.gain.linearRampToValueAtTime(0.0001, now + duration);
      } else {
        incoming.audio.volume = 0;
        this.fadeAudioVolume(outgoing.audio, this.masterVolume, 0, duration);
        this.fadeAudioVolume(incoming.audio, 0, this.masterVolume, duration);
      }

      await incoming.audio.play();

      if (this.transitionTimer) clearTimeout(this.transitionTimer);
      this.transitionTimer = setTimeout(() => {
        outgoing.audio.pause();
        outgoing.audio.currentTime = 0;
        if (outgoing.gainNode) outgoing.gainNode.gain.value = 0;
        if (incoming.gainNode) incoming.gainNode.gain.value = 1.0;

        this.activeChannelIndex = (1 - this.activeChannelIndex) as 0 | 1;
        this.currentTrack = nextTrack;
        this.updateMediaSessionMetadata(nextTrack);
        this.isTransitioning = false;
        this.transitionTimer = null;
        this.onTrackAdvance?.(nextTrack);
      }, duration * 1000);
    } catch (err) {
      console.warn('Crossfade transition encountered error, falling back:', err);
      this.isTransitioning = false;
      this.onEnded?.();
    }
  }

  private async startGaplessHandoff(nextTrack: Track) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const outgoing = this.active;
    const incoming = this.standby;

    try {
      await this.resumeAudioContext();
      incoming.audio.currentTime = 0;
      if (incoming.gainNode) {
        incoming.gainNode.gain.cancelScheduledValues(0);
        incoming.gainNode.gain.value = 1.0;
      } else {
        incoming.audio.volume = this.masterVolume;
      }

      await incoming.audio.play();

      outgoing.audio.pause();
      outgoing.audio.currentTime = 0;
      if (outgoing.gainNode) outgoing.gainNode.gain.value = 0;

      this.activeChannelIndex = (1 - this.activeChannelIndex) as 0 | 1;
      this.currentTrack = nextTrack;
      this.updateMediaSessionMetadata(nextTrack);
      this.isTransitioning = false;
      this.onTrackAdvance?.(nextTrack);
    } catch (err) {
      console.warn('Gapless handoff fallback:', err);
      this.isTransitioning = false;
      this.onEnded?.();
    }
  }

  private fadeAudioVolume(audio: HTMLAudioElement, fromVol: number, toVol: number, durationSec: number) {
    const steps = 12;
    const stepTime = (durationSec * 1000) / steps;
    const diff = (toVol - fromVol) / steps;
    let currentStep = 0;
    audio.volume = Math.max(0, Math.min(1, fromVol));

    const interval = setInterval(() => {
      currentStep++;
      const nextVal = Math.max(0, Math.min(1, fromVol + diff * currentStep));
      audio.volume = nextVal;
      if (currentStep >= steps) {
        clearInterval(interval);
        audio.volume = Math.max(0, Math.min(1, toVol));
      }
    }, stepTime);
  }

  // --- Track Playback Controls ---
  public async loadTrack(track: Track, autoPlay = true, options?: { quickCrossfade?: boolean }): Promise<void> {
    const isCurrentlyPlaying = !this.active.audio.paused;

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
      this.isTransitioning = false;
    }

    // Quick smooth crossfade (0.35s) on user manual song switch if music is currently playing
    if (isCurrentlyPlaying && autoPlay && options?.quickCrossfade !== false && this.isInitialized) {
      const outgoing = this.active;
      const incoming = this.standby;

      incoming.track = track;
      incoming.audio.src = track.url;
      incoming.audio.currentTime = 0;
      this.currentTrack = track;
      this.updateMediaSessionMetadata(track);

      const fadeDur = 0.35;
      await this.resumeAudioContext();

      if (this.audioCtx && incoming.gainNode && outgoing.gainNode) {
        const now = this.audioCtx.currentTime;
        incoming.gainNode.gain.cancelScheduledValues(now);
        incoming.gainNode.gain.setValueAtTime(0.0001, now);
        incoming.gainNode.gain.linearRampToValueAtTime(1.0, now + fadeDur);

        outgoing.gainNode.gain.cancelScheduledValues(now);
        outgoing.gainNode.gain.setValueAtTime(outgoing.gainNode.gain.value, now);
        outgoing.gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeDur);
      } else {
        incoming.audio.volume = 0;
        this.fadeAudioVolume(outgoing.audio, this.masterVolume, 0, fadeDur);
        this.fadeAudioVolume(incoming.audio, 0, this.masterVolume, fadeDur);
      }

      await incoming.audio.play();

      setTimeout(() => {
        outgoing.audio.pause();
        outgoing.audio.currentTime = 0;
        if (outgoing.gainNode) outgoing.gainNode.gain.value = 0;
        if (incoming.gainNode) incoming.gainNode.gain.value = 1.0;
        this.activeChannelIndex = (1 - this.activeChannelIndex) as 0 | 1;
      }, fadeDur * 1000);

      return;
    }

    // Standard load
    this.currentTrack = track;
    const active = this.active;
    active.track = track;
    active.audio.src = track.url;
    active.audio.currentTime = 0;
    if (active.gainNode) active.gainNode.gain.value = 1.0;

    this.standby.audio.pause();
    this.standby.audio.currentTime = 0;
    if (this.standby.gainNode) this.standby.gainNode.gain.value = 0;

    this.updateMediaSessionMetadata(track);

    if (autoPlay) {
      await this.play();
    }
  }

  public async play(): Promise<void> {
    try {
      await this.resumeAudioContext();
      await this.active.audio.play();
      if (this.isTransitioning) {
        await this.standby.audio.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Playback play request prevented:', err);
    }
  }

  public pause(): void {
    this.active.audio.pause();
    if (this.isTransitioning) {
      this.standby.audio.pause();
    }
  }

  public togglePlayPause(): void {
    if (this.active.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  public seekTo(seconds: number): void {
    if (isNaN(seconds)) return;
    const active = this.active;
    const clamped = Math.max(0, Math.min(seconds, active.audio.duration || 0));
    active.audio.currentTime = clamped;

    // If seeking during transition, cancel transition
    if (this.isTransitioning) {
      if (this.transitionTimer) clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
      this.isTransitioning = false;
      this.standby.audio.pause();
      this.standby.audio.currentTime = 0;
      if (active.gainNode) active.gainNode.gain.value = 1.0;
      if (this.standby.gainNode) this.standby.gainNode.gain.value = 0;
    }

    this.updateMediaSessionPosition();
  }

  public seekBy(deltaSeconds: number): void {
    this.seekTo(this.active.audio.currentTime + deltaSeconds);
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterVolume = clamped;
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.isMutedState ? 0 : clamped;
    }
    this.channels[0].audio.volume = clamped;
    this.channels[1].audio.volume = clamped;
  }

  public setMute(muted: boolean): void {
    this.isMutedState = muted;
    this.channels[0].audio.muted = muted;
    this.channels[1].audio.muted = muted;
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = muted ? 0 : this.masterVolume;
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public getCurrentTime(): number {
    return this.active.audio.currentTime || 0;
  }

  public getDuration(): number {
    return this.active.audio.duration || 0;
  }

  public isPaused(): boolean {
    return this.active.audio.paused;
  }

  public isPlaying(): boolean {
    return !this.active.audio.paused;
  }

  // --- Gapless & Crossfade Getters / Setters ---
  public setCrossfadeDuration(seconds: number): void {
    this.crossfadeDuration = Math.max(0, Math.min(12, Math.round(seconds)));
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  public setGaplessEnabled(enabled: boolean): void {
    this.isGaplessEnabled = enabled;
    if (!enabled && this.standby.track) {
      this.standby.audio.removeAttribute('src');
      this.standby.audio.load();
      this.standby.track = null;
    }
  }

  public getGaplessEnabled(): boolean {
    return this.isGaplessEnabled;
  }

  public isCrossfading(): boolean {
    return this.isTransitioning;
  }

  // --- Equalizer Controls ---
  public setEqGain(bandIndex: number, gainDb: number): void {
    this.currentGains[bandIndex] = gainDb;
    if (this.eqFilters[bandIndex]) {
      this.eqFilters[bandIndex].gain.setTargetAtTime(gainDb, this.audioCtx?.currentTime || 0, 0.05);
    }
  }

  public setEqPreset(preset: EqualizerPreset): void {
    preset.gains.forEach((gain, idx) => {
      this.setEqGain(idx, gain);
    });
    if (preset.bassBoost !== undefined) {
      this.setBassBoost(preset.bassBoost);
    }
    if (preset.bassBoostEnabled !== undefined) {
      this.setBassBoostEnabled(preset.bassBoostEnabled);
    }
  }

  public setBassBoostEnabled(enabled: boolean): void {
    this.isBassBoostEnabled = enabled;
    if (this.bassFilter) {
      const targetGain = enabled ? this.currentBassBoost : 0;
      this.bassFilter.gain.setTargetAtTime(targetGain, this.audioCtx?.currentTime || 0, 0.05);
    }
  }

  public setBassBoost(gainDb: number): void {
    this.currentBassBoost = gainDb;
    if (this.bassFilter && this.isBassBoostEnabled) {
      this.bassFilter.gain.setTargetAtTime(gainDb, this.audioCtx?.currentTime || 0, 0.05);
    }
  }

  public getEqGains(): number[] {
    return [...this.currentGains];
  }

  public getBassBoostEnabled(): boolean {
    return this.isBassBoostEnabled;
  }

  public getBassBoost(): number {
    return this.currentBassBoost;
  }

  // --- Audio Visualizer Analysis ---
  public getVisualizerData(frequencyArray: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(frequencyArray as any);
    } else {
      frequencyArray.fill(0);
    }
  }

  public getWaveformData(timeDomainArray: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(timeDomainArray as any);
    } else {
      timeDomainArray.fill(128);
    }
  }

  // --- MediaSession API (Lock Screen, Notification & Hardware Keys) ---
  public setupMediaSessionHandlers(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onSeekTo: (time: number) => void;
  }) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => {
        handlers.onPlay();
        this.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        handlers.onPause();
        this.pause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlers.onPrevious();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handlers.onNext();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          handlers.onSeekTo(details.seekTime);
          this.seekTo(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        this.seekBy(-skip);
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        this.seekBy(skip);
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.pause();
        this.seekTo(0);
      });
    } catch (err) {
      console.warn('MediaSession handler configuration warning:', err);
    }
  }

  private updateMediaSessionMetadata(track: Track) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const artwork = track.coverArtUrl
        ? [{ src: track.coverArtUrl, sizes: '512x512', type: 'image/jpeg' }]
        : [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork,
      });
    } catch (err) {
      console.warn('Error setting MediaMetadata:', err);
    }
  }

  private updateMediaSessionPlaybackState(state: 'playing' | 'paused') {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {
      // ignore
    }
  }

  private updateMediaSessionPosition() {
    if (
      typeof window === 'undefined' ||
      !('mediaSession' in navigator) ||
      !navigator.mediaSession.setPositionState
    ) {
      return;
    }

    try {
      const activeAudio = this.active.audio;
      if (
        activeAudio.duration &&
        !isNaN(activeAudio.duration) &&
        isFinite(activeAudio.duration)
      ) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, activeAudio.duration),
          playbackRate: activeAudio.playbackRate || 1,
          position: Math.max(0, Math.min(activeAudio.currentTime, activeAudio.duration)),
        });
      }
    } catch {
      // ignore
    }
  }
}

export const audioEngine = new AudioEngine();
