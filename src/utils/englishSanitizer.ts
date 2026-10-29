import { Track } from '../types/audio';

/**
 * Common music terms and general words translation dictionary.
 * Translates terms from Japanese Romaji, French, Spanish, German, Italian, Portuguese,
 * Russian, Latin, etc. into natural, clean English.
 */
const WORD_TRANSLATIONS: Record<string, string> = {
  // Japanese Romaji
  'komorebi': 'Sunlight Through Leaves',
  'sakura': 'Cherry Blossom',
  'hikari': 'Light',
  'yume': 'Dream',
  'tsuki': 'Moon',
  'sora': 'Sky',
  'kaze': 'Wind',
  'ame': 'Rain',
  'matsuri': 'Festival',
  'kokoro': 'Heart',
  'hanabi': 'Fireworks',
  'hoshi': 'Star',
  'ai': 'Love',
  'ongaku': 'Music',
  'uta': 'Song',
  'yoru': 'Night',
  'asa': 'Morning',
  'kiseki': 'Miracle',
  'tabi': 'Journey',
  'nami': 'Wave',
  'tokiyo': 'Tokyo',
  'tokyo': 'Tokyo',
  'shizuku': 'Droplet',
  'shizuka': 'Serenity',
  'shinonome': 'Dawn',
  'tasogare': 'Twilight',
  'yuuyake': 'Sunset',
  'hotaru': 'Firefly',
  'sayonara': 'Farewell',
  'arigato': 'Gratitude',
  'gensokyo': 'Fantasy Realm',
  'tenshi': 'Angel',
  'akuma': 'Shadow',
  'kenshi': 'Swordsman',
  'samurai': 'Warrior',
  'ninja': 'Shadow Walker',
  'shinobi': 'Stealth',
  'katana': 'Blade',
  'ronin': 'Wanderer',
  'zen': 'Meditation',
  'manga': 'Comic',
  'anime': 'Animation',
  'otaku': 'Fan',
  'kawaii': 'Cute',
  'arashi': 'Storm',
  'fuyu': 'Winter',
  'natsu': 'Summer',
  'haru': 'Spring',
  'aki': 'Autumn',
  'ginga': 'Galaxy',
  'hoshiyora': 'Starry Sky',
  'shizukesa': 'Stillness',
  'gensou': 'Illusion',
  'kibou': 'Hope',
  'hikaru': 'Shining',
  'kuro': 'Black',
  'aka': 'Red',
  'ao': 'Blue',
  'shiro': 'White',

  // French
  'chanson': 'Song',
  'chansons': 'Songs',
  'musique': 'Music',
  'artiste': 'Artist',
  'inconnu': 'Unknown',
  'inconnue': 'Unknown',
  'disque': 'Album',
  'pluie': 'Rain',
  'nuit': 'Night',
  'nuits': 'Nights',
  'soleil': 'Sun',
  'lune': 'Moon',
  'etoile': 'Star',
  'etoiles': 'Stars',
  'amour': 'Love',
  'reve': 'Dream',
  'reves': 'Dreams',
  'danse': 'Dance',
  'danses': 'Dances',
  'ete': 'Summer',
  'hiver': 'Winter',
  'printemps': 'Spring',
  'automne': 'Autumn',
  'coeur': 'Heart',
  'lumiere': 'Light',
  'voyage': 'Journey',
  'feu': 'Fire',
  'eau': 'Water',
  'silence': 'Silence',
  'rythme': 'Rhythm',
  'vague': 'Wave',
  'vagues': 'Waves',
  'ciel': 'Sky',
  'vent': 'Wind',
  'espace': 'Space',
  'nouveau': 'New',
  'nouvelle': 'New',
  'sombre': 'Dark',
  'doux': 'Sweet',
  'douce': 'Sweet',
  'matin': 'Morning',
  'soir': 'Evening',
  'mer': 'Sea',
  'ocean': 'Ocean',
  'memoire': 'Memory',
  'temps': 'Time',
  'vie': 'Life',
  'belle': 'Beautiful',
  'beau': 'Handsome',
  'rose': 'Rose',
  'monde': 'World',
  'clair': 'Bright',
  'adieu': 'Farewell',
  'bonjour': 'Greetings',
  'voix': 'Voice',

  // Spanish
  'despacito': 'Slowly',
  'cancion': 'Song',
  'canciones': 'Songs',
  'musica': 'Music',
  'artista': 'Artist',
  'desconocido': 'Unknown',
  'desconocida': 'Unknown',
  'disco': 'Album',
  'pista': 'Track',
  'pistas': 'Tracks',
  'lluvia': 'Rain',
  'noche': 'Night',
  'noches': 'Nights',
  'dia': 'Day',
  'dias': 'Days',
  'sol': 'Sun',
  'luna': 'Moon',
  'estrella': 'Star',
  'estrellas': 'Stars',
  'amor': 'Love',
  'sueno': 'Dream',
  'suenos': 'Dreams',
  'baile': 'Dance',
  'verano': 'Summer',
  'invierno': 'Winter',
  'primavera': 'Spring',
  'otono': 'Autumn',
  'corazon': 'Heart',
  'luz': 'Light',
  'viaje': 'Journey',
  'fuego': 'Fire',
  'agua': 'Water',
  'tierra': 'Earth',
  'silencio': 'Silence',
  'ritmo': 'Rhythm',
  'ola': 'Wave',
  'olas': 'Waves',
  'cielo': 'Sky',
  'viento': 'Wind',
  'nuevo': 'New',
  'nueva': 'New',
  'oscuro': 'Dark',
  'oscura': 'Dark',
  'dulce': 'Sweet',
  'manana': 'Morning',
  'tarde': 'Afternoon',
  'mar': 'Sea',
  'playa': 'Beach',
  'rio': 'River',
  'vida': 'Life',
  'esperanza': 'Hope',
  'fiesta': 'Party',
  'guitarra': 'Guitar',
  'feliz': 'Happy',
  'triste': 'Sad',
  'adios': 'Goodbye',
  'hola': 'Hello',

  // German
  'lied': 'Song',
  'lieder': 'Songs',
  'musik': 'Music',
  'kunstler': 'Artist',
  'unbekannt': 'Unknown',
  'spur': 'Track',
  'regen': 'Rain',
  'nacht': 'Night',
  'nachte': 'Nights',
  'sonne': 'Sun',
  'mond': 'Moon',
  'stern': 'Star',
  'sterne': 'Stars',
  'liebe': 'Love',
  'traum': 'Dream',
  'traume': 'Dreams',
  'tanz': 'Dance',
  'sommer': 'Summer',
  'winter': 'Winter',
  'fruhling': 'Spring',
  'herbst': 'Autumn',
  'herz': 'Heart',
  'licht': 'Light',
  'reise': 'Journey',
  'feuer': 'Fire',
  'wasser': 'Water',
  'stille': 'Silence',
  'rhythmus': 'Rhythm',
  'welle': 'Wave',
  'wellen': 'Waves',
  'himmel': 'Sky',
  'wind': 'Wind',
  'erde': 'Earth',
  'neu': 'New',
  'dunkel': 'Dark',
  'morgen': 'Morning',
  'abend': 'Evening',
  'zeit': 'Time',
  'welt': 'World',
  'leben': 'Life',
  'klang': 'Sound',
  'schon': 'Beautiful',

  // Italian
  'brano': 'Song',
  'brani': 'Songs',
  'canzone': 'Song',
  'canzoni': 'Songs',
  'sconosciuto': 'Unknown',
  'pioggia': 'Rain',
  'notti': 'Nights',
  'giorno': 'Day',
  'stelle': 'Stars',
  'sole': 'Sun',
  'onde': 'Waves',
  'scuro': 'Dark',
  'bella': 'Beautiful',
  'bello': 'Handsome',
  'ciao': 'Hello',

  // Portuguese
  'faixa': 'Track',
  'faixas': 'Tracks',
  'cancao': 'Song',
  'cancoes': 'Songs',
  'chuva': 'Rain',
  'lua': 'Moon',
  'danca': 'Dance',
  'verao': 'Summer',
  'coracao': 'Heart',
  'ceu': 'Sky',
  'saudade': 'Longing',
};

/**
 * Cyrillic transliteration mapping to English Latin script
 */
const CYRILLIC_MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
};

/**
 * Strips diacritics and accents (e.g. é -> e, ü -> u, ñ -> n, ø -> o, ç -> c)
 */
function removeDiacritics(str: string): string {
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Curated list of elegant English song title fallbacks
 */
const ELEGANT_ENGLISH_TITLES = [
  'Acoustic Reverie',
  'Midnight Echoes',
  'Harmonic Horizon',
  'Crimson Pulse',
  'Velvet Sunset',
  'Ambient Wave',
  'Starlight Symphony',
  'Electric Glow',
  'Silver Dawn',
  'Golden Rhythm',
  'Obsidian Dream',
  'Whispering Wind',
  'Neon Reverberation',
  'Oceanic Voyage',
  'Timeless Melody',
];

/**
 * Converts foreign or accented text into clean, normalized English Latin script
 * while strictly preserving the song's original name and words.
 */
export function toEnglishOnly(input: string, fallback: string = 'Unknown Track'): string {
  if (!input || !input.trim()) return fallback;

  let text = input.trim();

  // 1. Transliterate Cyrillic if present
  let transliterated = '';
  for (const char of text) {
    transliterated += CYRILLIC_MAP[char] !== undefined ? CYRILLIC_MAP[char] : char;
  }
  text = transliterated;

  // 2. Remove diacritics (accents, umlauts, cedillas, macrons)
  text = removeDiacritics(text);

  // 3. Remove non-printable control characters, but preserve standard punctuation and letters
  text = text.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim();

  // 4. If text contains letters, digits, or standard title text, PRESERVE IT!
  if (text && /[a-zA-Z0-9]/.test(text)) {
    // Clean out stray emojis or non-Latin glyphs if mixed
    const cleanLatin = text.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();
    if (cleanLatin && /[a-zA-Z0-9]/.test(cleanLatin)) {
      return cleanLatin;
    }
  }

  // 5. If completely non-Latin glyphs (Kanji, Hiragana, etc.), use the safe English fallback
  return fallback;
}

/**
 * Normalizes metadata fields of a Track while preserving the original song name and artist.
 */
export function sanitizeTrackToEnglish(track: Track, index: number = 1): Track {
  const originalTitle = track.title && track.title.trim() ? track.title.trim() : '';
  const fallbackTitle = track.fileName ? track.fileName.replace(/\.[^/.]+$/, '') : `Track ${index}`;

  const cleanTitle = originalTitle ? toEnglishOnly(originalTitle, fallbackTitle) : fallbackTitle;
  const cleanArtist = track.artist && track.artist.trim() ? toEnglishOnly(track.artist, 'Local Artist') : 'Local Artist';
  const cleanAlbum = track.album && track.album.trim() ? toEnglishOnly(track.album, 'Offline Collection') : 'Offline Collection';

  let cleanFileName = track.fileName;
  if (!cleanFileName) {
    cleanFileName = `${cleanTitle.toLowerCase().replace(/[^a-z0-9_.-]/g, '_')}.${track.format || 'mp3'}`;
  }

  return {
    ...track,
    title: cleanTitle,
    artist: cleanArtist,
    album: cleanAlbum,
    fileName: cleanFileName,
  };
}
