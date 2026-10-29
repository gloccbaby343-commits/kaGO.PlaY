import type { RepeatMode, Track } from '../types/audio.ts';

/**
 * Calculates the next track index taking into account repeat mode and shuffle
 */
export function getNextTrackIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: RepeatMode,
  isShuffle: boolean,
  shuffleIndices?: number[]
): number | null {
  if (queueLength <= 0) return null;
  if (repeatMode === 'one') return currentIndex;

  if (isShuffle && shuffleIndices && shuffleIndices.length === queueLength) {
    const currentShufflePos = shuffleIndices.indexOf(currentIndex);
    if (currentShufflePos >= 0 && currentShufflePos + 1 < queueLength) {
      return shuffleIndices[currentShufflePos + 1];
    }
    // End of shuffled list
    if (repeatMode === 'all') {
      return shuffleIndices[0];
    }
    return null;
  }

  // Normal sequential playback
  if (currentIndex + 1 < queueLength) {
    return currentIndex + 1;
  }

  if (repeatMode === 'all') {
    return 0;
  }

  return null;
}

/**
 * Calculates the previous track index taking into account repeat mode and shuffle
 */
export function getPreviousTrackIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: RepeatMode,
  isShuffle: boolean,
  shuffleIndices?: number[]
): number {
  if (queueLength <= 0) return 0;
  if (repeatMode === 'one') return currentIndex;

  if (isShuffle && shuffleIndices && shuffleIndices.length === queueLength) {
    const currentShufflePos = shuffleIndices.indexOf(currentIndex);
    if (currentShufflePos > 0) {
      return shuffleIndices[currentShufflePos - 1];
    }
    // At start of shuffle
    if (repeatMode === 'all') {
      return shuffleIndices[queueLength - 1];
    }
    return shuffleIndices[0];
  }

  if (currentIndex > 0) {
    return currentIndex - 1;
  }

  if (repeatMode === 'all') {
    return queueLength - 1;
  }

  return 0;
}

/**
 * Generates an array of randomized indices, keeping current index first
 */
export function generateShuffleIndices(queueLength: number, currentIndex: number): number[] {
  if (queueLength <= 1) return Array.from({ length: queueLength }, (_, i) => i);

  const pool: number[] = [];
  for (let i = 0; i < queueLength; i++) {
    if (i !== currentIndex) pool.push(i);
  }

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return [currentIndex, ...pool];
}

/**
 * Reorders an array when dragged / moved
 */
export function reorderQueue(queue: Track[], fromIndex: number, toIndex: number): Track[] {
  if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) {
    return [...queue];
  }
  const result = [...queue];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
