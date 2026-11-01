/**
 * YouTube IFrame Audio Streaming Player Service
 * Completely free, no login or sign-up required.
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export class YouTubePlayerService {
  private player: any = null;
  private isReady = false;
  private pendingVideoId: string | null = null;
  private pendingAutoPlay = false;
  private timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private currentVideoId: string | null = null;
  private currentVolume = 0.8;
  private isMutedState = false;

  public onTimeUpdate?: (currentTime: number, duration: number) => void;
  public onPlayStateChange?: (isPlaying: boolean) => void;
  public onEnded?: () => void;
  public onError?: (msg: string) => void;

  constructor() {
    this.initApi();
  }

  private initApi() {
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      this.createPlayer();
      return;
    }

    // Load YouTube IFrame API script tag
    const prevScript = document.getElementById('youtube-iframe-api');
    if (!prevScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      this.createPlayer();
    };
  }

  private createPlayer() {
    if (typeof window === 'undefined' || !window.YT || !window.YT.Player) return;

    // Ensure floating mobile-friendly player container exists
    let container = document.getElementById('yt-player-host');
    if (!container) {
      container = document.createElement('div');
      container.id = 'yt-player-host';
      container.style.position = 'fixed';
      container.style.bottom = '85px';
      container.style.right = '12px';
      container.style.width = '144px';
      container.style.height = '81px';
      container.style.borderRadius = '10px';
      container.style.overflow = 'hidden';
      container.style.backgroundColor = '#000000';
      container.style.zIndex = '35';
      container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.85)';
      container.style.border = '2px solid rgba(255, 62, 62, 0.4)';
      container.style.display = 'none'; // Only displayed when video is streaming
      document.body.appendChild(container);
    }

    const playerTarget = document.createElement('div');
    playerTarget.id = 'yt-player-element';
    container.innerHTML = '';
    container.appendChild(playerTarget);

    try {
      const isHttp = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
      this.player = new window.YT.Player('yt-player-element', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          ...(isHttp ? { origin: window.location.origin } : {}),
        },
        events: {
          onReady: () => {
            this.isReady = true;
            this.player.setVolume(Math.round(this.currentVolume * 100));
            if (this.isMutedState) this.player.mute();

            if (this.pendingVideoId) {
              const vid = this.pendingVideoId;
              const auto = this.pendingAutoPlay;
              this.pendingVideoId = null;
              this.pendingAutoPlay = false;
              this.loadVideo(vid, auto);
            }
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
            if (event.data === 1) {
              this.startTimeUpdates();
              this.onPlayStateChange?.(true);
            } else if (event.data === 2) {
              this.stopTimeUpdates();
              this.onPlayStateChange?.(false);
            } else if (event.data === 0) {
              this.stopTimeUpdates();
              this.onPlayStateChange?.(false);
              this.onEnded?.();
            }
          },
          onError: (e: any) => {
            console.warn('YouTube streaming player error:', e);
            this.onError?.('Failed to stream selected YouTube audio.');
          },
        },
      });
    } catch (err) {
      console.warn('Could not initialize YouTube player instance:', err);
    }
  }

  private startTimeUpdates() {
    this.stopTimeUpdates();
    this.timeUpdateInterval = setInterval(() => {
      if (this.player && typeof this.player.getCurrentTime === 'function') {
        const curr = this.player.getCurrentTime() || 0;
        const dur = this.player.getDuration() || 0;
        this.onTimeUpdate?.(curr, dur);
      }
    }, 250);
  }

  private stopTimeUpdates() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  public loadVideo(videoId: string, autoPlay = true): void {
    this.currentVideoId = videoId;

    if (!this.isReady || !this.player || typeof this.player.loadVideoById !== 'function') {
      this.pendingVideoId = videoId;
      this.pendingAutoPlay = autoPlay;
      if (!this.player) this.createPlayer();
      return;
    }

    const container = document.getElementById('yt-player-host');
    if (container) {
      container.style.display = 'block';
    }

    try {
      if (videoId.startsWith('search:')) {
        const queryTerm = decodeURIComponent(videoId.replace('search:', ''));
        if (typeof this.player.loadPlaylist === 'function') {
          this.player.loadPlaylist({
            listType: 'search',
            list: queryTerm,
            index: 0,
            startSeconds: 0,
          });
          if (autoPlay) this.player.playVideo();
        } else {
          const iframe = this.player.getIframe?.();
          if (iframe) {
            iframe.src = `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(queryTerm)}&autoplay=1&playsinline=1&enablejsapi=1&rel=0`;
          }
        }
      } else if (autoPlay) {
        this.player.loadVideoById({
          videoId,
          startSeconds: 0,
        });
        this.player.playVideo();
      } else {
        this.player.cueVideoById({
          videoId,
          startSeconds: 0,
        });
      }
    } catch (err) {
      console.warn('Error loading YouTube video:', err);
    }
  }


  public stop(): void {
    this.stopTimeUpdates();
    if (this.player && typeof this.player.stopVideo === 'function') {
      this.player.stopVideo();
    }
    const container = document.getElementById('yt-player-host');
    if (container) {
      container.style.display = 'none';
    }
    this.currentVideoId = null;
  }

  public play(): void {
    if (this.player && typeof this.player.playVideo === 'function') {
      this.player.playVideo();
    }
  }

  public pause(): void {
    if (this.player && typeof this.player.pauseVideo === 'function') {
      this.player.pauseVideo();
    }
    this.stopTimeUpdates();
  }

  public togglePlayPause(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seekTo(seconds: number): void {
    if (this.player && typeof this.player.seekTo === 'function') {
      this.player.seekTo(seconds, true);
      const dur = this.getDuration();
      this.onTimeUpdate?.(seconds, dur);
    }
  }

  public setVolume(vol: number): void {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.player && typeof this.player.setVolume === 'function') {
      this.player.setVolume(Math.round(this.currentVolume * 100));
    }
  }

  public setMute(muted: boolean): void {
    this.isMutedState = muted;
    if (this.player) {
      if (muted && typeof this.player.mute === 'function') {
        this.player.mute();
      } else if (!muted && typeof this.player.unMute === 'function') {
        this.player.unMute();
      }
    }
  }

  public getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function') {
      return this.player.getCurrentTime() || 0;
    }
    return 0;
  }

  public getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function') {
      return this.player.getDuration() || 0;
    }
    return 0;
  }

  public isPlaying(): boolean {
    if (this.player && typeof this.player.getPlayerState === 'function') {
      return this.player.getPlayerState() === 1;
    }
    return false;
  }

  public getCurrentVideoId(): string | null {
    return this.currentVideoId;
  }
}

export const youtubePlayerService = new YouTubePlayerService();
