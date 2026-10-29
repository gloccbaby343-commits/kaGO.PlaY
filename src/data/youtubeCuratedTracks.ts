import { YouTubeSearchResult } from '../types/audio';

export interface GenreCategory {
  tag: string;
  tracks: YouTubeSearchResult[];
}

export const CURATED_YOUTUBE_TRACKS: Record<string, YouTubeSearchResult[]> = {
  'Top Global Hits': [
    {
      id: '4NRXx6U8ABQ',
      title: 'Blinding Lights',
      fullTitle: 'The Weeknd - Blinding Lights (Official Video)',
      artist: 'The Weeknd',
      durationStr: '3:20',
      durationSeconds: 200,
      thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
      views: '3.1B views',
    },
    {
      id: 'H5v3kku4y6Q',
      title: 'As It Was',
      fullTitle: 'Harry Styles - As It Was (Official Video)',
      artist: 'Harry Styles',
      durationStr: '2:47',
      durationSeconds: 167,
      thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg',
      views: '800M views',
    },
    {
      id: 'G7KNmW9a75Y',
      title: 'Flowers',
      fullTitle: 'Miley Cyrus - Flowers (Official Video)',
      artist: 'Miley Cyrus',
      durationStr: '3:20',
      durationSeconds: 200,
      thumbnail: 'https://i.ytimg.com/vi/G7KNmW9a75Y/hqdefault.jpg',
      views: '950M views',
    },
    {
      id: 'TUVcZfQe-Kw',
      title: 'Levitating',
      fullTitle: 'Dua Lipa - Levitating (Official Music Video)',
      artist: 'Dua Lipa',
      durationStr: '3:23',
      durationSeconds: 203,
      thumbnail: 'https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg',
      views: '900M views',
    },
    {
      id: 'eVli-tstM5E',
      title: 'Espresso',
      fullTitle: 'Sabrina Carpenter - Espresso (Official Video)',
      artist: 'Sabrina Carpenter',
      durationStr: '2:55',
      durationSeconds: 175,
      thumbnail: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg',
      views: '250M views',
    },
    {
      id: 'ic8j13piAhQ',
      title: 'Cruel Summer',
      fullTitle: 'Taylor Swift - Cruel Summer (Official Audio)',
      artist: 'Taylor Swift',
      durationStr: '2:58',
      durationSeconds: 178,
      thumbnail: 'https://i.ytimg.com/vi/ic8j13piAhQ/hqdefault.jpg',
      views: '400M views',
    },
    {
      id: 'V9PVRfjEBTI',
      title: 'BIRDS OF A FEATHER',
      fullTitle: 'Billie Eilish - BIRDS OF A FEATHER (Official Music Video)',
      artist: 'Billie Eilish',
      durationStr: '3:14',
      durationSeconds: 194,
      thumbnail: 'https://i.ytimg.com/vi/V9PVRfjEBTI/hqdefault.jpg',
      views: '180M views',
    },
    {
      id: 'JGwWNGJdvx8',
      title: 'Shape of You',
      fullTitle: 'Ed Sheeran - Shape of You (Official Music Video)',
      artist: 'Ed Sheeran',
      durationStr: '3:53',
      durationSeconds: 233,
      thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
      views: '6.2B views',
    },
  ],

  'Afrobeats': [
    {
      id: '421w1j87fEM',
      title: 'Last Last',
      fullTitle: 'Burna Boy - Last Last (Official Music Video)',
      artist: 'Burna Boy',
      durationStr: '2:52',
      durationSeconds: 172,
      thumbnail: 'https://i.ytimg.com/vi/421w1j87fEM/hqdefault.jpg',
      views: '260M views',
    },
    {
      id: 'CQLsdm1ZYAw',
      title: 'Calm Down',
      fullTitle: 'Rema - Calm Down (Official Music Video)',
      artist: 'Rema',
      durationStr: '3:39',
      durationSeconds: 219,
      thumbnail: 'https://i.ytimg.com/vi/CQLsdm1ZYAw/hqdefault.jpg',
      views: '630M views',
    },
    {
      id: 'jipQpjUA_o8',
      title: 'Essence',
      fullTitle: 'Wizkid - Essence (Official Video) ft. Tems',
      artist: 'Wizkid ft. Tems',
      durationStr: '4:08',
      durationSeconds: 248,
      thumbnail: 'https://i.ytimg.com/vi/jipQpjUA_o8/hqdefault.jpg',
      views: '190M views',
    },
    {
      id: 'M0Yy8Z4j2pQ',
      title: 'Lonely At The Top',
      fullTitle: 'Asake - Lonely At The Top (Official Video)',
      artist: 'Asake',
      durationStr: '2:38',
      durationSeconds: 158,
      thumbnail: 'https://i.ytimg.com/vi/M0Yy8Z4j2pQ/hqdefault.jpg',
      views: '85M views',
    },
    {
      id: 'OSBan_sH_98',
      title: 'UNAVAILABLE',
      fullTitle: 'Davido - UNAVAILABLE ft. Musa Keys (Official Video)',
      artist: 'Davido ft. Musa Keys',
      durationStr: '2:51',
      durationSeconds: 171,
      thumbnail: 'https://i.ytimg.com/vi/OSBan_sH_98/hqdefault.jpg',
      views: '110M views',
    },
    {
      id: 'fG26t4qXl2o',
      title: 'Me & U',
      fullTitle: 'Tems - Me & U (Official Video)',
      artist: 'Tems',
      durationStr: '3:13',
      durationSeconds: 193,
      thumbnail: 'https://i.ytimg.com/vi/fG26t4qXl2o/hqdefault.jpg',
      views: '28M views',
    },
    {
      id: 'cSCuT8wSp2c',
      title: 'Rush',
      fullTitle: 'Ayra Starr - Rush (Official Music Video)',
      artist: 'Ayra Starr',
      durationStr: '3:05',
      durationSeconds: 185,
      thumbnail: 'https://i.ytimg.com/vi/cSCuT8wSp2c/hqdefault.jpg',
      views: '350M views',
    },
    {
      id: 'D-YDEq4k9wA',
      title: 'Love Nwantiti',
      fullTitle: 'CKay - Love Nwantiti (Ah Ah Ah) [Official Music Video]',
      artist: 'CKay',
      durationStr: '2:26',
      durationSeconds: 146,
      thumbnail: 'https://i.ytimg.com/vi/D-YDEq4k9wA/hqdefault.jpg',
      views: '520M views',
    },
  ],

  'Hip-Hop & Rap': [
    {
      id: 'H58vbez_m4E',
      title: 'Not Like Us',
      fullTitle: 'Kendrick Lamar - Not Like Us',
      artist: 'Kendrick Lamar',
      durationStr: '4:34',
      durationSeconds: 274,
      thumbnail: 'https://i.ytimg.com/vi/H58vbez_m4E/hqdefault.jpg',
      views: '220M views',
    },
    {
      id: 'xpVfcZ0ZcFM',
      title: "God's Plan",
      fullTitle: "Drake - God's Plan (Official Music Video)",
      artist: 'Drake',
      durationStr: '3:19',
      durationSeconds: 199,
      thumbnail: 'https://i.ytimg.com/vi/xpVfcZ0ZcFM/hqdefault.jpg',
      views: '1.6B views',
    },
    {
      id: 'Dst9gZkq1a8',
      title: 'Goosebumps',
      fullTitle: 'Travis Scott - goosebumps (Official Music Video) ft. Kendrick Lamar',
      artist: 'Travis Scott ft. Kendrick Lamar',
      durationStr: '4:03',
      durationSeconds: 243,
      thumbnail: 'https://i.ytimg.com/vi/Dst9gZkq1a8/hqdefault.jpg',
      views: '1.2B views',
    },
    {
      id: '_Yhyp-_hX2s',
      title: 'Lose Yourself',
      fullTitle: 'Eminem - Lose Yourself [HD]',
      artist: 'Eminem',
      durationStr: '5:26',
      durationSeconds: 326,
      thumbnail: 'https://i.ytimg.com/vi/_Yhyp-_hX2s/hqdefault.jpg',
      views: '1.4B views',
    },
    {
      id: '4jQ62rW9iP8',
      title: 'No Role Modelz',
      fullTitle: 'J. Cole - No Role Modelz (Audio)',
      artist: 'J. Cole',
      durationStr: '4:53',
      durationSeconds: 293,
      thumbnail: 'https://i.ytimg.com/vi/4jQ62rW9iP8/hqdefault.jpg',
      views: '600M views',
    },
    {
      id: 'N9bKdxA24pE',
      title: 'Like That',
      fullTitle: 'Future, Metro Boomin, Kendrick Lamar - Like That (Audio)',
      artist: 'Future, Metro Boomin, Kendrick Lamar',
      durationStr: '4:27',
      durationSeconds: 267,
      thumbnail: 'https://i.ytimg.com/vi/N9bKdxA24pE/hqdefault.jpg',
      views: '150M views',
    },
  ],

  'Lo-Fi Chill Beats': [
    {
      id: '4xDzrJKXOOY',
      title: 'synthwave radio - chill beats to relax/game to',
      fullTitle: 'Lofi Girl - synthwave radio',
      artist: 'Lofi Girl',
      durationStr: '3:45',
      durationSeconds: 225,
      thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
      views: '35M views',
    },
    {
      id: '7NOSDKb0HlU',
      title: 'Cozy Winter Beats',
      fullTitle: 'Chillhop Essentials - Cozy Winter Beats',
      artist: 'Chillhop Music',
      durationStr: '3:30',
      durationSeconds: 210,
      thumbnail: 'https://i.ytimg.com/vi/7NOSDKb0HlU/hqdefault.jpg',
      views: '12M views',
    },
    {
      id: 'jfKfPfyJRdk',
      title: 'lofi hip hop radio 📚 - beats to relax/study to',
      fullTitle: 'Lofi Girl - Study Beats',
      artist: 'Lofi Girl',
      durationStr: '3:50',
      durationSeconds: 230,
      thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
      views: '90M views',
    },
  ],

  'Synthwave 80s': [
    {
      id: 'MV_3Dpw-BRY',
      title: 'Nightcall',
      fullTitle: 'Kavinsky - Nightcall (Drive Soundtrack)',
      artist: 'Kavinsky',
      durationStr: '4:19',
      durationSeconds: 259,
      thumbnail: 'https://i.ytimg.com/vi/MV_3Dpw-BRY/hqdefault.jpg',
      views: '310M views',
    },
    {
      id: 'rDBbaGCCIhk',
      title: 'Sunset',
      fullTitle: 'The Midnight - Sunset (Official Audio)',
      artist: 'The Midnight',
      durationStr: '5:26',
      durationSeconds: 326,
      thumbnail: 'https://i.ytimg.com/vi/rDBbaGCCIhk/hqdefault.jpg',
      views: '45M views',
    },
    {
      id: '5NV6Rdv1a3I',
      title: 'Get Lucky',
      fullTitle: 'Daft Punk - Get Lucky (Official Audio) ft. Pharrell Williams, Nile Rodgers',
      artist: 'Daft Punk ft. Pharrell Williams',
      durationStr: '4:08',
      durationSeconds: 248,
      thumbnail: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
      views: '920M views',
    },
  ],

  'Pop Anthems': [
    {
      id: 'RlPNh_PBZb4',
      title: 'vampire',
      fullTitle: 'Olivia Rodrigo - vampire (Official Video)',
      artist: 'Olivia Rodrigo',
      durationStr: '3:40',
      durationSeconds: 220,
      thumbnail: 'https://i.ytimg.com/vi/RlPNh_PBZb4/hqdefault.jpg',
      views: '170M views',
    },
    {
      id: 'kPa7bsKwL-c',
      title: 'Die With A Smile',
      fullTitle: 'Lady Gaga, Bruno Mars - Die With A Smile (Official Music Video)',
      artist: 'Lady Gaga & Bruno Mars',
      durationStr: '4:11',
      durationSeconds: 251,
      thumbnail: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
      views: '230M views',
    },
    {
      id: '34Na4j8AVgA',
      title: 'Starboy',
      fullTitle: 'The Weeknd - Starboy ft. Daft Punk (Official Music Video)',
      artist: 'The Weeknd ft. Daft Punk',
      durationStr: '3:50',
      durationSeconds: 230,
      thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
      views: '2.4B views',
    },
  ],

  'Electronic & EDM': [
    {
      id: 'ebXbLfLACGM',
      title: 'Summer',
      fullTitle: 'Calvin Harris - Summer (Official Video)',
      artist: 'Calvin Harris',
      durationStr: '3:54',
      durationSeconds: 234,
      thumbnail: 'https://i.ytimg.com/vi/ebXbLfLACGM/hqdefault.jpg',
      views: '1.6B views',
    },
    {
      id: 'IcrbM1l_BoI',
      title: 'Wake Me Up',
      fullTitle: 'Avicii - Wake Me Up (Official Video)',
      artist: 'Avicii',
      durationStr: '4:12',
      durationSeconds: 252,
      thumbnail: 'https://i.ytimg.com/vi/IcrbM1l_BoI/hqdefault.jpg',
      views: '2.4B views',
    },
  ],

  'Rock Classics': [
    {
      id: 'fJ9rUzIMcZQ',
      title: 'Bohemian Rhapsody',
      fullTitle: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
      artist: 'Queen',
      durationStr: '5:55',
      durationSeconds: 355,
      thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
      views: '1.7B views',
    },
    {
      id: 'hTWKbfoikeg',
      title: 'Smells Like Teen Spirit',
      fullTitle: 'Nirvana - Smells Like Teen Spirit (Official Music Video)',
      artist: 'Nirvana',
      durationStr: '5:01',
      durationSeconds: 301,
      thumbnail: 'https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg',
      views: '1.8B views',
    },
  ],

  'R&B Soul': [
    {
      id: 'SQnc1Q33F14',
      title: 'Kill Bill',
      fullTitle: 'SZA - Kill Bill (Official Video)',
      artist: 'SZA',
      durationStr: '2:33',
      durationSeconds: 153,
      thumbnail: 'https://i.ytimg.com/vi/SQnc1Q33F14/hqdefault.jpg',
      views: '400M views',
    },
    {
      id: 'hKgl5-lkT8U',
      title: 'Best Part',
      fullTitle: 'Daniel Caesar - Best Part (feat. H.E.R.)',
      artist: 'Daniel Caesar ft. H.E.R.',
      durationStr: '3:39',
      durationSeconds: 219,
      thumbnail: 'https://i.ytimg.com/vi/hKgl5-lkT8U/hqdefault.jpg',
      views: '350M views',
    },
  ],
};

/**
 * Searches the curated catalogue or extracts a YouTube video ID if provided
 */
export function searchCuratedYouTubeTracks(query: string): YouTubeSearchResult[] {
  if (!query || !query.trim()) {
    return CURATED_YOUTUBE_TRACKS['Top Global Hits'] || [];
  }

  const q = query.trim().toLowerCase();

  // If the query directly matches a genre tag
  for (const [tag, tracks] of Object.entries(CURATED_YOUTUBE_TRACKS)) {
    if (tag.toLowerCase() === q) {
      return tracks;
    }
  }

  // Filter across all tracks in all categories
  const allTracks: YouTubeSearchResult[] = [];
  const seenIds = new Set<string>();

  for (const tracks of Object.values(CURATED_YOUTUBE_TRACKS)) {
    for (const t of tracks) {
      if (!seenIds.has(t.id)) {
        seenIds.add(t.id);
        allTracks.push(t);
      }
    }
  }

  const filtered = allTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.fullTitle ? t.fullTitle.toLowerCase().includes(q) : false)
  );

  return filtered.length > 0 ? filtered : allTracks.slice(0, 12);
}

/**
 * Extracts a YouTube Video ID from any URL or string
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();

  // Pure 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // Common YouTube URL regexes
  const match =
    str.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/i) ||
    str.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);

  return match ? match[1] : null;
}
