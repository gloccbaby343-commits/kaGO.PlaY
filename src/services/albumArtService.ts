import { Track } from '../types/audio';
import { generateProceduralVisualizerArt } from '../utils/visualizerArtGenerator';

export interface AlbumArtResult {
  success: boolean;
  coverArtUrl: string;
  source: 'itunes' | 'gemini-api' | 'procedural-visualizer' | 'client-fallback';
}

/**
 * Service to fetch official album art or generate a unique visualizer cover
 * using the Gemini API (analyzing song title & artist) with an authentic procedural fallback.
 */
class AlbumArtService {
  async fetchOrGenerateAlbumArt(
    track: Track,
    preferAi = false
  ): Promise<AlbumArtResult> {
    try {
      const response = await fetch('/api/album-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          album: track.album,
          preferAi,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.coverArtUrl) {
          return {
            success: true,
            coverArtUrl: data.coverArtUrl,
            source: data.source || 'gemini-api',
          };
        }
      }
    } catch (err) {
      console.warn('Network error during album art fetch/generation, using offline visualizer generator:', err);
    }

    // Offline / Network fallback
    const offlineVisualizerUrl = generateProceduralVisualizerArt({
      title: track.title,
      artist: track.artist,
      genre: track.album || track.format,
    });

    return {
      success: true,
      coverArtUrl: offlineVisualizerUrl,
      source: 'client-fallback',
    };
  }
}

export const albumArtService = new AlbumArtService();
