import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFolderNameFromPath,
  groupTracksByFolder,
  getTracksInFolder,
} from './folderUtils.ts';
import type { Track } from '../types/audio.ts';

test('extractFolderNameFromPath extracts top-level folder name', () => {
  assert.equal(extractFolderNameFromPath('Music/Song1.mp3'), 'Music');
  assert.equal(extractFolderNameFromPath('My Hits/2024/Track.flac'), 'My Hits');
  assert.equal(extractFolderNameFromPath('SoloFile.wav'), undefined);
  assert.equal(extractFolderNameFromPath(''), undefined);
});

test('groupTracksByFolder aggregates tracks into correct folders with duration and counts', () => {
  const tracks: Track[] = [
    {
      id: '1',
      title: 'Track One',
      artist: 'Artist A',
      album: 'Album A',
      duration: 120,
      url: '',
      format: 'mp3',
      coverGradient: 'from-red-600 via-rose-700 to-black',
      fileSize: 5000,
      addedAt: 1,
      folderName: 'Rock Classics',
    },
    {
      id: '2',
      title: 'Track Two',
      artist: 'Artist B',
      album: 'Album B',
      duration: 180,
      url: '',
      format: 'wav',
      coverGradient: 'from-red-600 via-rose-700 to-black',
      fileSize: 15000,
      addedAt: 2,
      folderName: 'Rock Classics',
    },
    {
      id: '3',
      title: 'Track Three',
      artist: 'Artist C',
      album: 'Album C',
      duration: 200,
      url: '',
      format: 'flac',
      coverGradient: 'from-red-600 via-rose-700 to-black',
      fileSize: 30000,
      addedAt: 3,
      folderName: 'Jazz Club',
    },
    {
      id: '4',
      title: 'Uncategorized',
      artist: 'Artist D',
      album: 'Album D',
      duration: 90,
      url: '',
      format: 'mp3',
      coverGradient: 'from-red-600 via-rose-700 to-black',
      addedAt: 4,
    },
  ];

  const folders = groupTracksByFolder(tracks);
  assert.equal(folders.length, 2);

  const rockFolder = folders.find((f) => f.name === 'Rock Classics');
  assert.ok(rockFolder);
  assert.equal(rockFolder.trackCount, 2);
  assert.equal(rockFolder.totalDuration, 300);
  assert.equal(rockFolder.totalSize, 20000);

  const jazzFolder = folders.find((f) => f.name === 'Jazz Club');
  assert.ok(jazzFolder);
  assert.equal(jazzFolder.trackCount, 1);
});

test('getTracksInFolder reads and filters tracks inside selected folder', () => {
  const tracks: Track[] = [
    {
      id: '1',
      title: 'hetera by elvo',
      artist: 'elvo',
      album: 'Local',
      duration: 150,
      url: '',
      format: 'mp3',
      coverGradient: '',
      addedAt: 1,
      folderName: 'My Device Storage',
      fileName: 'hetera by elvo.mp3',
    },
    {
      id: '2',
      title: 'Another Tune',
      artist: 'Singer',
      album: 'Local',
      duration: 200,
      url: '',
      format: 'wav',
      coverGradient: '',
      addedAt: 2,
      folderName: 'My Device Storage',
      fileName: 'Another Tune.wav',
    },
    {
      id: '3',
      title: 'Other Folder Song',
      artist: 'Stranger',
      album: 'Other',
      duration: 100,
      url: '',
      format: 'mp3',
      coverGradient: '',
      addedAt: 3,
      folderName: 'Other Folder',
    },
  ];

  // Read all in folder
  const inFolder = getTracksInFolder(tracks, 'My Device Storage');
  assert.equal(inFolder.length, 2);
  assert.equal(inFolder[0].title, 'hetera by elvo');

  // Search inside folder
  const searched = getTracksInFolder(tracks, 'My Device Storage', 'hetera');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].artist, 'elvo');
});
