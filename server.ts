import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { generateProceduralVisualizerArt } from './src/utils/visualizerArtGenerator.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Procedural fallback audio synthesizer when API key is not yet set or Lyria is unavailable
 * Generates an authentic, crisp 15-second procedural audio clip (WAV) in memory
 */
function generateFallbackMusicClip(genre: string = 'synthwave'): string {
  const sampleRate = 22050;
  const durationSec = 15;
  const numSamples = sampleRate * durationSec;
  const buffer = new Int16Array(numSamples);

  // Musical scales
  const scales: Record<string, number[]> = {
    rock: [110, 146.83, 164.81, 196, 220, 246.94, 293.66],
    jazz: [130.81, 155.56, 174.61, 207.65, 233.08, 261.63],
    classical: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00],
    electronic: [65.41, 130.81, 196.00, 261.63, 392.00],
    synthwave: [73.42, 110.00, 146.83, 220.00, 293.66],
  };

  const scale = scales[genre.toLowerCase()] || scales.synthwave;
  const bpm = 120;
  const beatDuration = 60 / bpm;
  const samplesPerBeat = Math.floor(sampleRate * beatDuration);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatIndex = Math.floor(i / samplesPerBeat);
    const noteFreq = scale[beatIndex % scale.length];

    // Bassline
    const bass = Math.sin(2 * Math.PI * (noteFreq / 2) * t) * 0.4;
    // Lead melody with harmonic overtone
    const lead = Math.sin(2 * Math.PI * noteFreq * t) * 0.3 + Math.sin(2 * Math.PI * noteFreq * 2 * t) * 0.15;
    // Kick drum pulse on beat
    const beatPhase = (i % samplesPerBeat) / samplesPerBeat;
    const kickEnv = Math.exp(-beatPhase * 16);
    const kick = Math.sin(2 * Math.PI * (150 * (1 - beatPhase) + 40) * t) * kickEnv * 0.5;

    // Hi-hat noise on off-beats
    const hatPhase = ((i + samplesPerBeat / 2) % samplesPerBeat) / samplesPerBeat;
    const hatEnv = Math.exp(-hatPhase * 32);
    const hat = (Math.random() * 2 - 1) * hatEnv * 0.15;

    const sample = Math.max(-1, Math.min(1, bass + lead + kick + hat));
    buffer[i] = Math.round(sample * 32767);
  }

  // Create minimal WAV header
  const wavBytes = new Uint8Array(44 + numSamples * 2);
  const view = new DataView(wavBytes.buffer);

  // RIFF identifier
  wavBytes.set([0x52, 0x49, 0x46, 0x46], 0);
  view.setUint32(4, 36 + numSamples * 2, true);
  // WAVE
  wavBytes.set([0x57, 0x41, 0x56, 0x45], 8);
  // fmt chunk
  wavBytes.set([0x66, 0x6d, 0x74, 0x20], 12);
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // 1 channel (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  // data chunk
  wavBytes.set([0x64, 0x61, 0x74, 0x61], 36);
  view.setUint32(40, numSamples * 2, true);

  // Write PCM data
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, buffer[i], true);
  }

  return Buffer.from(wavBytes).toString('base64');
}

/**
 * POST /api/generate-music
 * Lyria AI Music Generation using lyria-3-clip-preview
 */
app.post('/api/generate-music', async (req, res) => {
  try {
    const { prompt, genre = 'Rock' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required in English' });
    }

    const ai = getGenAI();

    if (ai) {
      try {
        const englishPrompt = `Generate a high quality 30-second ${genre} music track: ${prompt}. Pure instrumental audio with crisp rhythm.`;
        const responseStream = await ai.models.generateContentStream({
          model: 'lyria-3-clip-preview',
          contents: englishPrompt,
        });

        let audioBase64 = '';
        let lyrics = '';
        let mimeType = 'audio/wav';

        for await (const chunk of responseStream) {
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (!parts) continue;

          for (const part of parts) {
            if (part.inlineData?.data) {
              if (!audioBase64 && part.inlineData.mimeType) {
                mimeType = part.inlineData.mimeType;
              }
              audioBase64 += part.inlineData.data;
            }
            if (part.text && !lyrics) {
              lyrics = part.text;
            }
          }
        }

        if (audioBase64) {
          return res.json({
            success: true,
            audioBase64,
            mimeType,
            lyrics: lyrics || 'Generated instrumental track by Lyria AI',
            title: `${genre} Clip - ${prompt.slice(0, 24)}`,
            artist: 'Lyria AI Studio',
            album: 'AI Generated Tracks',
            source: 'lyria-3-clip-preview',
          });
        }
      } catch (lyriaErr: any) {
        console.warn('Lyria API call error, using procedural synth fallback:', lyriaErr?.message);
      }
    }

    // High quality synthesized fallback if Lyria key not set or stream empty
    const fallbackBase64 = generateFallbackMusicClip(genre);
    return res.json({
      success: true,
      audioBase64: fallbackBase64,
      mimeType: 'audio/wav',
      lyrics: 'Instrumental Procedural Synthesizer Clip',
      title: `${genre} Melody - ${prompt.slice(0, 24)}`,
      artist: 'AuraWave AI Synthesizer',
      album: 'Procedural Beats',
      source: 'procedural-synthesizer',
    });
  } catch (error: any) {
    console.error('Music generation failure:', error);
    res.status(500).json({ error: error?.message || 'Music generation failed' });
  }
});

/**
 * POST /api/search-music
 * Google Search Grounding with gemini-3.8-flash (tools: [{ googleSearch: {} }])
 * Retrieves real-time artist discographies, album history, lyrics context, and music trivia strictly in English
 */
app.post('/api/search-music', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        summary: `Music Information for "${query}": A popular music subject featuring diverse genres, recordings, and artist discography. Connect GEMINI_API_KEY to enable live real-time Google Search grounding.`,
        sources: [],
        queries: [query],
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide comprehensive, accurate real-time information about the music artist, song, album, or genre: "${query}". Include key facts, popular tracks, album release history, and genre context. All text must be in English only.`,
      config: {
        systemInstruction: 'You are an authoritative global music encyclopedia. Provide concise, fascinating, accurate information grounded in Google Search. All output must be strictly in English only.',
        tools: [{ googleSearch: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const sources = (groundingMetadata?.groundingChunks || []).map((chunk: any) => ({
      title: chunk.web?.title || 'Google Search Reference',
      url: chunk.web?.uri || '',
    })).filter((s: any) => s.url);

    const searchQueries = groundingMetadata?.webSearchQueries || [query];

    return res.json({
      success: true,
      summary: response.text || 'No information found.',
      sources,
      queries: searchQueries,
    });
  } catch (error: any) {
    console.error('Search grounding failure:', error);
    res.status(500).json({ error: error?.message || 'Search grounding request failed' });
  }
});

function getDemoSynchronizedLyrics(trackName: string): string | null {
  const lower = trackName.toLowerCase();
  if (lower.includes('neon horizon')) {
    return `[00:00.00] (Instrumental Synthesizer Introduction)\n[00:04.00] Driving through the neon lights tonight\n[00:08.00] Electric highways in the glowing twilight\n[00:12.00] Echoes of the retro horizon call my name\n[00:16.00] Synthesizer pulses running through my veins\n[00:20.00] Endless retrowave dreams under crimson skies\n[00:24.00] (Instrumental Outro)`;
  }
  if (lower.includes('midnight rain')) {
    return `[00:00.00] (Gentle raindrops falling on the pavement)\n[00:04.00] Soft lo-fi piano in the late night coffee bar\n[00:08.00] Watching raindrops trace reflections from afar\n[00:12.00] Muffled vinyl crackle warms the quiet room\n[00:16.00] Drifting with the rhythm as memories bloom\n[00:20.00] Serene peace in midnight rain until the dawn\n[00:24.00] (Gentle rainfall fades)`;
  }
  if (lower.includes('solar wind')) {
    return `[00:00.00] (Cosmic ambient drone ascending)\n[00:05.00] Floating past the boundaries of the solar storm\n[00:10.00] Waves of stellar radiance quiet and warm\n[00:15.00] Gravitational harmonics echo in the deep\n[00:20.00] Where the nebulae and silent stars sleep\n[00:25.00] Cosmic infinity, drifting into light\n[00:28.00] (Ambient fadeout)`;
  }
  if (lower.includes('cyber pulse')) {
    return `[00:00.00] (High-octane electro pulse starts)\n[00:04.00] Cybernetic heartbeat surging in the grid\n[00:08.00] High-velocity frequencies unmask what we hid\n[00:12.00] Digital adrenaline breaking through the sound\n[00:16.00] Feel the electro groove reverberate around\n[00:20.00] System overload, the energy takes flight\n[00:24.00] (HyperDrive beat finishes)`;
  }
  return null;
}

// Synchronized Lyrics Fetching using external metadata service (LRCLIB)
app.get('/api/lyrics', async (req, res) => {
  try {
    const track = (req.query.track as string || '').trim();
    const artist = (req.query.artist as string || '').trim();
    const album = (req.query.album as string || '').trim();
    const duration = parseFloat(req.query.duration as string || '0');

    if (!track) {
      return res.status(400).json({ error: 'Track name is required' });
    }

    // 1. Check procedural demo tracks for instant offline response
    const demoLyrics = getDemoSynchronizedLyrics(track);
    if (demoLyrics) {
      return res.json({
        success: true,
        syncedLyrics: demoLyrics,
        plainLyrics: demoLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '').trim(),
        source: 'AuraWave Studio Procedural Synchronized Lyrics',
        isInstrumental: false,
      });
    }

    // 2. Query LRCLIB external metadata service
    let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track)}`;
    if (artist && artist.toLowerCase() !== 'unknown' && artist.toLowerCase() !== 'local artist') {
      url += `&artist_name=${encodeURIComponent(artist)}`;
    }
    if (album && album.toLowerCase() !== 'unknown' && album.toLowerCase() !== 'offline collection') {
      url += `&album_name=${encodeURIComponent(album)}`;
    }
    if (duration > 0) {
      url += `&duration=${Math.round(duration)}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    let lrcResponse = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AuraWaveMusicPlayer/1.0 (https://github.com/example/aurawave)',
      },
    }).catch(() => null);

    clearTimeout(timeout);

    let data: any = null;
    if (lrcResponse && lrcResponse.ok) {
      data = await lrcResponse.json().catch(() => null);
    }

    // 3. Fallback to LRCLIB search if exact duration / title mismatch
    if (!data?.syncedLyrics) {
      const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(track)}${
        artist && artist.toLowerCase() !== 'local artist' ? `&artist_name=${encodeURIComponent(artist)}` : ''
      }`;
      const searchController = new AbortController();
      const searchTimeout = setTimeout(() => searchController.abort(), 4500);

      const searchResp = await fetch(searchUrl, {
        signal: searchController.signal,
        headers: {
          'User-Agent': 'AuraWaveMusicPlayer/1.0 (https://github.com/example/aurawave)',
        },
      }).catch(() => null);

      clearTimeout(searchTimeout);

      if (searchResp && searchResp.ok) {
        const searchList = await searchResp.json().catch(() => []);
        if (Array.isArray(searchList) && searchList.length > 0) {
          const withSync = searchList.find((item: any) => item.syncedLyrics);
          data = withSync || searchList[0];
        }
      }
    }

    if (data && (data.syncedLyrics || data.plainLyrics || data.instrumental)) {
      return res.json({
        success: true,
        syncedLyrics: data.syncedLyrics || null,
        plainLyrics: data.plainLyrics || null,
        source: 'LRCLIB Synchronized Metadata Service',
        isInstrumental: !!data.instrumental,
      });
    }

    return res.json({
      success: false,
      message: 'No synchronized lyrics found in external metadata service for this title.',
    });
  } catch (error: any) {
    console.error('Lyrics API endpoint failure:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch lyrics' });
  }
});

/**
 * POST /api/album-art
 * Analyzes track title and artist using the Gemini API to generate
 * a unique placeholder visualizer image for the track's album cover.
 * Also checks official album covers via iTunes Search API.
 */
app.post('/api/album-art', async (req, res) => {
  try {
    const { title, artist, album, preferAi } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Song title is required' });
    }

    const cleanArtist =
      artist &&
      artist.toLowerCase() !== 'unknown artist' &&
      artist.toLowerCase() !== 'local artist'
        ? artist
        : '';

    // 1. If not strictly preferAi, attempt official album cover search via iTunes Search API
    if (!preferAi) {
      try {
        const queryTerm = cleanArtist ? `${title} ${cleanArtist}` : title;
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(queryTerm)}&entity=song&limit=1`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const itunesRes = await fetch(itunesUrl, { signal: controller.signal }).catch(() => null);
        clearTimeout(timeout);

        if (itunesRes && itunesRes.ok) {
          const data = await itunesRes.json().catch(() => null);
          if (data && data.results && data.results.length > 0) {
            const hit = data.results[0];
            const originalArt = hit.artworkUrl100 || hit.artworkUrl60;
            if (originalArt) {
              const highResArt = originalArt.replace(/\/\d+x\d+bb\.jpg/i, '/600x600bb.jpg');
              return res.json({
                success: true,
                coverArtUrl: highResArt,
                source: 'itunes',
                title: hit.trackName || title,
                artist: hit.artistName || artist,
              });
            }
          }
        }
      } catch (itunesErr) {
        console.warn('iTunes album art lookup skipped:', itunesErr);
      }
    }

    // 2. Gemini API: Analyze song title & artist and generate a unique visualizer SVG image
    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `You are a high-end graphic designer for kaGO.PIaY, an ultra-modern dark red and black music streaming app.
Analyze the song title "${title}" by artist "${artist || 'Unknown Artist'}" (album: "${album || 'Single'}").
1. Infer its emotional mood, sonic energy, and musical genre.
2. Generate a unique, high-resolution visualizer album cover in SVG format (viewBox="0 0 600 600", width="600", height="600").
Design guidelines:
- Theme: Signature obsidian black (#0c0c0e, #16161a) and glowing neon red/crimson accents (#ff3e3e, #f43f5e, #991b1b, #fda4af).
- Visualizer elements: Prominent music visualizer graphics (e.g. glowing radial frequency spectrum spikes, oscillating soundwaves, concentric vinyl groove pulses, or neon equalizer bars).
- Typography: Display the song title "${title.slice(0, 28)}" and artist "${(artist || 'Unknown Artist').slice(0, 24)}" in elegant, modern typography with high contrast.
- Filters: Include <defs> with glowing SVG filters (<filter id="glow">).
- Output: Return ONLY raw, valid SVG markup starting with <svg and ending with </svg>. No introductory text, no markdown explanation.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const text = response.text || '';
        const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
        if (svgMatch) {
          const svgMarkup = svgMatch[0];
          const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
          return res.json({
            success: true,
            coverArtUrl: dataUrl,
            source: 'gemini-api',
            title,
            artist,
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini album art generation failed, using procedural visualizer:', geminiErr?.message);
      }
    }

    // 3. Guaranteed high-fidelity procedural visualizer image fallback
    const fallbackSvgDataUrl = generateProceduralVisualizerArt({
      title,
      artist: artist || 'Unknown Artist',
      genre: album || 'Offline Audio',
    });

    return res.json({
      success: true,
      coverArtUrl: fallbackSvgDataUrl,
      source: 'procedural-visualizer',
      title,
      artist,
    });
  } catch (error: any) {
    console.error('Album art generation endpoint error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate album art' });
  }
});

function parseDurationToSeconds(str: string): number {
  if (!str) return 0;
  const parts = str.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

// GET /api/youtube/search?q={query} - Free streaming search with zero signup
app.get('/api/youtube/search', async (req, res) => {
  try {
    const rawQuery = ((req.query.q as string) || '').trim();
    const query = rawQuery || 'top global hits 2024';
    const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    }).catch(() => null);

    clearTimeout(timeout);

    let videos: any[] = [];

    if (response && response.ok) {
      const html = await response.text().catch(() => '');
      const match =
        html.match(/var ytInitialData = ({.*?});<\/script>/) ||
        html.match(/ytInitialData\s*=\s*({.+?});/);

      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const contents =
            data.contents?.twoColumnSearchResultsRenderer?.primaryContents
              ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

          for (const item of contents) {
            const v = item.videoRenderer;
            if (v && v.videoId) {
              const durationText = v.lengthText?.simpleText || '3:30';
              const durationSec = parseDurationToSeconds(durationText);
              const title =
                v.title?.runs?.[0]?.text ||
                (typeof v.title?.simpleText === 'string' ? v.title.simpleText : 'Unknown Track');
              const artist =
                v.ownerText?.runs?.[0]?.text ||
                v.longBylineText?.runs?.[0]?.text ||
                'YouTube Artist';
              const thumb =
                v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
                `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

              videos.push({
                id: v.videoId,
                title:
                  title
                    .replace(/\(Official.*?\)/gi, '')
                    .replace(/\[Official.*?\]/gi, '')
                    .replace(/\(Audio\)/gi, '')
                    .replace(/\(Lyric Video\)/gi, '')
                    .trim() || title,
                fullTitle: title,
                artist,
                durationStr: durationText,
                durationSeconds: durationSec > 0 ? durationSec : 210,
                thumbnail: thumb,
                views: v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || '',
              });
            }
          }
        } catch (parseErr) {
          console.warn('Error parsing ytInitialData:', parseErr);
        }
      }
    }

    return res.json({
      success: true,
      query,
      results: videos.slice(0, 24),
    });
  } catch (err: any) {
    console.error('YouTube search error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to search YouTube' });
  }
});

// Full-Stack Dev & Production mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`kaGO.PIaY server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
