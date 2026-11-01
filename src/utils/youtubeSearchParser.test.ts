/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  parseDurationToSeconds,
  cleanVideoTitle,
  extractYouTubeVideosFromData,
  extractYtInitialData,
} from './youtubeSearchParser';

test('parseDurationToSeconds handles hh:mm:ss, mm:ss and fallbacks', () => {
  assert.strictEqual(parseDurationToSeconds('3:25'), 205);
  assert.strictEqual(parseDurationToSeconds('1:02:15'), 3735);
  assert.strictEqual(parseDurationToSeconds('0:45'), 45);
  assert.strictEqual(parseDurationToSeconds(''), 210);
  assert.strictEqual(parseDurationToSeconds(undefined), 210);
});

test('cleanVideoTitle strips official tags and extracts artist when formatted', () => {
  const r1 = cleanVideoTitle('The Weeknd - Blinding Lights [Official Music Video]');
  assert.strictEqual(r1.title, 'Blinding Lights');
  assert.strictEqual(r1.artistFromTitle, 'The Weeknd');

  const r2 = cleanVideoTitle('Burna Boy - City Boys (Official Video)');
  assert.strictEqual(r2.title, 'City Boys');
  assert.strictEqual(r2.artistFromTitle, 'Burna Boy');

  const r3 = cleanVideoTitle('Eminem - Houdini [Official Video]');
  assert.strictEqual(r3.title, 'Houdini');
  assert.strictEqual(r3.artistFromTitle, 'Eminem');

  const r4 = cleanVideoTitle('Simple Track Title');
  assert.strictEqual(r4.title, 'Simple Track Title');
  assert.strictEqual(r4.artistFromTitle, undefined);
});

test('extractYouTubeVideosFromData handles both videoRenderer and lockupViewModel', () => {
  const mockData = {
    contents: {
      twoColumnSearchResultsRenderer: {
        primaryContents: {
          sectionListRenderer: {
            contents: [
              {
                itemSectionRenderer: {
                  contents: [
                    {
                      videoRenderer: {
                        videoId: 'dQw4w9WgXcQ',
                        title: { runs: [{ text: 'Rick Astley - Never Gonna Give You Up (Official Music Video)' }] },
                        ownerText: { runs: [{ text: 'Rick Astley' }] },
                        lengthText: { simpleText: '3:33' },
                        thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' }] },
                        viewCountText: { simpleText: '1.4B views' },
                      },
                    },
                    {
                      lockupViewModel: {
                        contentId: '22tVWwmTie8',
                        metadata: {
                          lockupMetadataViewModel: {
                            title: { content: 'Eminem - Houdini [Official Music Video]' },
                            metadataRows: [
                              { metadataParts: [{ text: { content: 'EminemMusic' } }] },
                              { metadataParts: [{ text: { content: '120M views' } }] },
                            ],
                          },
                        },
                        contentImage: {
                          thumbnailViewModel: {
                            image: {
                              sources: [{ url: 'https://i.ytimg.com/vi/22tVWwmTie8/hqdefault.jpg' }],
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  };

  const vids = extractYouTubeVideosFromData(mockData);
  assert.strictEqual(vids.length, 2);
  assert.strictEqual(vids[0].id, 'dQw4w9WgXcQ');
  assert.strictEqual(vids[0].title, 'Never Gonna Give You Up');
  assert.strictEqual(vids[0].artist, 'Rick Astley');
  assert.strictEqual(vids[0].durationSeconds, 213);

  assert.strictEqual(vids[1].id, '22tVWwmTie8');
  assert.strictEqual(vids[1].title, 'Houdini');
  assert.strictEqual(vids[1].artist, 'Eminem');
});

test('extractYtInitialData extracts JSON across multiple lines and scripts', () => {
  const multilineHtml = `
    <html>
      <head></head>
      <body>
        <script>
          var ytInitialData = {
            "contents": {
              "status": "ok",
              "items": [1, 2, 3]
            }
          };
        </script>
      </body>
    </html>
  `;

  const parsed = extractYtInitialData(multilineHtml);
  assert.ok(parsed);
  assert.strictEqual(parsed.contents.status, 'ok');
  assert.strictEqual(parsed.contents.items.length, 3);
});
