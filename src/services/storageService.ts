import { Playlist, Track, EqualizerPreset } from '../types/audio';
import { cleanFileName, hasCjkOrForeignGibberish } from '../utils/id3Parser';

const DB_NAME = 'kaGO_PIaY_Audio_DB';
const DB_VERSION = 1;

export interface StoredTrackRecord {
  id: string;
  metadata: Omit<Track, 'url'>;
  audioBlob?: Blob;
}

export interface AppSettings {
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  eqPreset: string;
  eqGains: number[];
  bassBoost: number;
  bassBoostEnabled?: boolean;
  crossfadeDuration?: number;
  gaplessEnabled?: boolean;
  hapticsEnabled?: boolean;
}


class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('tracks')) {
          db.createObjectStore('tracks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Track Storage ---
  async saveTrack(track: Track, blob?: Blob): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tracks', 'readwrite');
      const store = tx.objectStore('tracks');
      const { url, ...metadata } = track;
      const record: StoredTrackRecord = {
        id: track.id,
        metadata,
        audioBlob: blob,
      };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllStoredTracks(): Promise<Track[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tracks', 'readwrite');
      const store = tx.objectStore('tracks');
      const request = store.getAll();

      request.onsuccess = () => {
        const records: StoredTrackRecord[] = request.result || [];
        const tracks: Track[] = records.map((r, idx) => {
          let trackUrl = '';
          if (r.audioBlob) {
            trackUrl = URL.createObjectURL(r.audioBlob);
          }

          let title = r.metadata?.title || '';
          let artist = r.metadata?.artist || '';
          let album = r.metadata?.album || '';
          const fileName = r.metadata?.fileName || (r.audioBlob as any)?.name || '';

          // If this track was corrupted with "English Melody" or CJK/mojibake characters:
          const isCorrupted =
            !title ||
            title.toLowerCase().includes('english melody') ||
            title.toLowerCase().includes('melody english') ||
            title.toLowerCase() === 'audio song' ||
            hasCjkOrForeignGibberish(title) ||
            hasCjkOrForeignGibberish(artist);

          if (isCorrupted) {
            if (
              fileName &&
              !fileName.toLowerCase().includes('english_melody') &&
              !fileName.toLowerCase().includes('english melody')
            ) {
              const cleaned = cleanFileName(fileName);
              title = cleaned.title;
              artist = cleaned.artist !== 'Unknown Artist' ? cleaned.artist : 'Local Artist';
            } else {
              title = `Offline Track ${idx + 1}`;
              artist = 'Device Storage';
            }
          }

          if (
            !artist ||
            artist.toLowerCase().includes('english melody') ||
            artist.toLowerCase().includes('melody english') ||
            hasCjkOrForeignGibberish(artist)
          ) {
            artist = 'Unknown Artist';
          }
          if (
            !album ||
            album.toLowerCase().includes('english melody') ||
            album.toLowerCase().includes('melody english') ||
            hasCjkOrForeignGibberish(album)
          ) {
            album = 'Device Storage';
          }

          // Revoked blob URLs cause broken image icons on page reload
          let coverArtUrl = r.metadata?.coverArtUrl;
          if (coverArtUrl && coverArtUrl.startsWith('blob:')) {
            coverArtUrl = undefined;
          }

          const healedTrack: Track = {
            ...r.metadata,
            title,
            artist,
            album,
            coverArtUrl,
            url: trackUrl,
          };

          // Save healed record back if title was fixed
          if (isCorrupted) {
            try {
              const { url: _u, ...healedMetadata } = healedTrack;
              store.put({
                id: r.id,
                metadata: healedMetadata,
                audioBlob: r.audioBlob,
              });
            } catch {
              // ignore async put error
            }
          }

          return healedTrack;
        });
        resolve(tracks);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateTrackMetadata(id: string, updates: Partial<Track>): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tracks', 'readwrite');
      const store = tx.objectStore('tracks');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record: StoredTrackRecord | undefined = getReq.result;
        if (!record) {
          resolve();
          return;
        }

        const updatedMetadata = {
          ...record.metadata,
          ...updates,
        };
        // Never save ephemeral blob url to storage metadata
        delete (updatedMetadata as any).url;

        store.put({
          ...record,
          metadata: updatedMetadata,
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteTrack(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tracks', 'readwrite');
      tx.objectStore('tracks').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Playlist Storage ---
  async getAllPlaylists(): Promise<Playlist[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('playlists', 'readonly');
      const request = tx.objectStore('playlists').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('playlists', 'readwrite');
      tx.objectStore('playlists').put(playlist);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deletePlaylist(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('playlists', 'readwrite');
      tx.objectStore('playlists').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Favorites Storage ---
  async getFavoriteIds(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('favorites', 'readonly');
      const request = tx.objectStore('favorites').getAll();
      request.onsuccess = () => {
        const res = request.result || [];
        resolve(res.map((item: { id: string }) => item.id));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async toggleFavorite(id: string, isFav: boolean): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('favorites', 'readwrite');
      const store = tx.objectStore('favorites');
      if (isFav) {
        store.put({ id, timestamp: Date.now() });
      } else {
        store.delete(id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Play History ---
  async addRecentTrack(trackId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('history', 'readwrite');
      tx.objectStore('history').put({ id: trackId, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getRecentTrackIds(): Promise<string[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('history', 'readonly');
      const request = tx.objectStore('history').getAll();
      request.onsuccess = () => {
        const res: { id: string; timestamp: number }[] = request.result || [];
        res.sort((a, b) => b.timestamp - a.timestamp);
        resolve(res.slice(0, 15).map((r) => r.id));
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --- Settings ---
  async getSettings(): Promise<Partial<AppSettings> | null> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('settings', 'readonly');
        const request = tx.objectStore('settings').get('app_settings');
        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'app_settings', data: settings });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const storageService = new StorageService();
