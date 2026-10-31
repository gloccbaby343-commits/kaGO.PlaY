import { test } from 'node:test';
import assert from 'node:assert';
import { cleanFileName, hasCjkOrForeignGibberish } from './id3Parser';

test('cleanFileName accurately extracts song titles and artists without altering them', () => {
  // Pattern 1: Artist - Title
  const res1 = cleanFileName('The Weeknd - Blinding Lights.mp3');
  assert.strictEqual(res1.artist, 'The Weeknd');
  assert.strictEqual(res1.title, 'Blinding Lights');

  // Pattern 2: Number prefix with dash
  const res2 = cleanFileName('01 - Bohemian Rhapsody.flac');
  assert.strictEqual(res2.title, 'Bohemian Rhapsody');

  // Pattern 3: Underscore separated
  const res3 = cleanFileName('Daft_Punk_-_Get_Lucky.wav');
  assert.strictEqual(res3.artist, 'Daft Punk');
  assert.strictEqual(res3.title, 'Get Lucky');

  // Pattern 4: Simple title
  const res4 = cleanFileName('My Own Original Track.m4a');
  assert.strictEqual(res4.title, 'My Own Original Track');
  assert.strictEqual(res4.artist, 'Unknown Artist');

  // Pattern 5: "Song by Artist" (user requested: hetera by elvo)
  const res5 = cleanFileName('hetera by elvo.mp3');
  assert.strictEqual(res5.title, 'hetera by elvo');
  assert.strictEqual(res5.artist, 'elvo');

  // Verify none of them turn into "English Melody" or static placeholders
  assert.notStrictEqual(res1.title, 'English Melody');
  assert.notStrictEqual(res2.title, 'English Melody');
  assert.notStrictEqual(res3.title, 'English Melody');
  assert.notStrictEqual(res4.title, 'English Melody');
  assert.notStrictEqual(res5.title, 'English Melody');
});

test('hasCjkOrForeignGibberish detects CJK characters and mojibake', () => {
  // Corrupted strings observed from ID3 encoding mismatches

  assert.strictEqual(hasCjkOrForeignGibberish('怂怂 简甄椀氀搀 蛊爀攀攀猀玢瑝磵氀攀'), true);
  assert.strictEqual(hasCjkOrForeignGibberish('雑⌐ 糾黎氀攀 • 简椀爀猀珵梔搀愀磵 简氀椀稀稀愀爀搀 𝓦(ㄱ)噪'), true);
  assert.strictEqual(hasCjkOrForeignGibberish('简甄椀氀搀'), true);
  assert.strictEqual(hasCjkOrForeignGibberish('Hello \uFFFD World'), true);

  // Normal English / Latin titles and artists
  assert.strictEqual(hasCjkOrForeignGibberish('hetera by elvo'), false);
  assert.strictEqual(hasCjkOrForeignGibberish('Cyber Pulse'), false);
  assert.strictEqual(hasCjkOrForeignGibberish('Boutross - Shrap'), false);
  assert.strictEqual(hasCjkOrForeignGibberish('Child Trees Freestyle'), false);
  assert.strictEqual(hasCjkOrForeignGibberish('The Weeknd - Blinding Lights'), false);
  assert.strictEqual(hasCjkOrForeignGibberish(''), false);
  assert.strictEqual(hasCjkOrForeignGibberish(undefined), false);
});

