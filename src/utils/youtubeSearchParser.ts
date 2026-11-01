/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export interface YouTubeSearchResult {
  id: string;
  title: string;
  fullTitle?: string;
  artist: string;
  durationStr: string;
  durationSeconds: number;
  thumbnail: string;
  views?: string;
}

export function parseDurationToSeconds(str?: string): number {
  if (!str || typeof str !== 'string') return 210;
  const clean = str.trim();
  const parts = clean.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return 210;
}

export function cleanVideoTitle(rawTitle: string): { title: string; artistFromTitle?: string } {
  if (!rawTitle) return { title: 'Unknown Track' };

  let clean = rawTitle
    .replace(/\[\s*(official\s*(music\s*)?video|audio|lyrics?|visualizer|hd|4k|hq|explicit|prod\.?.*?)\s*\]/gi, '')
    .replace(/\(\s*(official\s*(music\s*)?video|audio|lyrics?|visualizer|hd|4k|hq|explicit|prod\.?.*?)\s*\)/gi, '')
    .replace(/\|\s*official\s*(music\s*)?video/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If title has "Artist - Track"
  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
      return {
        artistFromTitle: parts[0].trim(),
        title: parts.slice(1).join(' - ').trim(),
      };
    }
  }

  return { title: clean || rawTitle };
}

/**
 * Universally extracts YouTube videos from YouTube HTML or parsed JSON data.
 * Supports legacy videoRenderer, new lockupViewModel, compactVideoRenderer, and musicResponsiveListItemRenderer.
 */
export function extractYouTubeVideosFromData(data: any): YouTubeSearchResult[] {
  if (!data || typeof data !== 'object') return [];

  const videos: YouTubeSearchResult[] = [];
  const seenIds = new Set<string>();

  function walk(node: any) {
    if (!node || typeof node !== 'object') return;

    // 1. Standard videoRenderer
    if (node.videoRenderer && node.videoRenderer.videoId) {
      const v = node.videoRenderer;
      const vidId = v.videoId;
      if (!seenIds.has(vidId) && vidId.length >= 10) {
        seenIds.add(vidId);
        const fullTitle =
          v.title?.runs?.[0]?.text ||
          (typeof v.title?.simpleText === 'string' ? v.title.simpleText : 'Unknown Track');
        const { title, artistFromTitle } = cleanVideoTitle(fullTitle);
        const channelArtist =
          v.ownerText?.runs?.[0]?.text ||
          v.longBylineText?.runs?.[0]?.text ||
          v.shortBylineText?.runs?.[0]?.text ||
          'YouTube Artist';

        const durationText = v.lengthText?.simpleText || '3:30';
        const thumb =
          v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
          `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;

        videos.push({
          id: vidId,
          title,
          fullTitle,
          artist: artistFromTitle || channelArtist,
          durationStr: durationText,
          durationSeconds: parseDurationToSeconds(durationText),
          thumbnail: thumb,
          views: v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || '',
        });
      }
    }

    // 2. Modern lockupViewModel (YouTube 2024+ format)
    if (node.lockupViewModel) {
      const l = node.lockupViewModel;
      let vidId = typeof l.contentId === 'string' ? l.contentId : '';
      if (!vidId) {
        const thumbUrl = JSON.stringify(l.contentImage || '');
        const m = thumbUrl.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
        if (m) vidId = m[1];
      }

      if (vidId && !seenIds.has(vidId) && vidId.length >= 10) {
        seenIds.add(vidId);
        const fullTitle = l.metadata?.lockupMetadataViewModel?.title?.content || 'YouTube Track';
        const { title, artistFromTitle } = cleanVideoTitle(fullTitle);
        const metaRows = l.metadata?.lockupMetadataViewModel?.metadataRows || [];
        const channelArtist = metaRows[0]?.metadataParts?.[0]?.text?.content || 'YouTube Artist';
        const viewsStr = metaRows[1]?.metadataParts?.[0]?.text?.content || '';

        // Extract thumbnail
        let thumb = `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`;
        const sources =
          l.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources ||
          l.contentImage?.thumbnailViewModel?.image?.sources;
        if (Array.isArray(sources) && sources.length > 0) {
          thumb = sources[sources.length - 1].url || thumb;
        }

        videos.push({
          id: vidId,
          title,
          fullTitle,
          artist: artistFromTitle || channelArtist,
          durationStr: '3:30',
          durationSeconds: 210,
          thumbnail: thumb,
          views: viewsStr,
        });
      }
    }

    // 3. CompactVideoRenderer / richItemRenderer
    if (node.compactVideoRenderer && node.compactVideoRenderer.videoId) {
      const v = node.compactVideoRenderer;
      const vidId = v.videoId;
      if (!seenIds.has(vidId)) {
        seenIds.add(vidId);
        const fullTitle = v.title?.simpleText || v.title?.runs?.[0]?.text || 'Track';
        const { title, artistFromTitle } = cleanVideoTitle(fullTitle);
        videos.push({
          id: vidId,
          title,
          fullTitle,
          artist: artistFromTitle || v.shortBylineText?.runs?.[0]?.text || 'YouTube Creator',
          durationStr: v.lengthText?.simpleText || '3:30',
          durationSeconds: parseDurationToSeconds(v.lengthText?.simpleText),
          thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
          views: v.viewCountText?.simpleText || '',
        });
      }
    }

    // Traverse children
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          walk(item);
        }
      } else if (child && typeof child === 'object') {
        walk(child);
      }
    }
  }

  walk(data);
  return videos;
}

/**
 * Extracts ytInitialData JSON object from raw YouTube search HTML
 */
export function extractYtInitialData(html: string): any {
  if (!html) return null;

  // Try dotAll regex matches
  const match =
    html.match(/ytInitialData\s*=\s*({.+?});\s*<\/script>/s) ||
    html.match(/ytInitialData\s*=\s*({.+?});/s) ||
    html.match(/window\["ytInitialData"\]\s*=\s*({.+?});/s);

  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      // Continue to bracket matcher
    }
  }

  // Bracket matching fallback
  const marker = 'ytInitialData';
  const idx = html.indexOf(marker);
  if (idx !== -1) {
    const start = html.indexOf('{', idx);
    if (start !== -1) {
      let depth = 0;
      let inStr = false;
      let quote = '';
      let esc = false;
      for (let i = start; i < Math.min(html.length, start + 3000000); i++) {
        const c = html[i];
        if (esc) {
          esc = false;
          continue;
        }
        if (c === '\\') {
          esc = true;
          continue;
        }
        if (inStr) {
          if (c === quote) inStr = false;
          continue;
        }
        if (c === '"' || c === "'") {
          inStr = true;
          quote = c;
          continue;
        }
        if (c === '{') depth++;
        else if (c === '}') {
          depth--;
          if (depth === 0) {
            try {
              return JSON.parse(html.slice(start, i + 1));
            } catch {
              break;
            }
          }
        }
      }
    }
  }

  return null;
}
