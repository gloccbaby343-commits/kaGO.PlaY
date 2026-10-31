/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { HapticsService, HAPTIC_PATTERNS } from './hapticsService';

test('HapticsService pattern definitions and triggers', () => {
  const calls: (number | number[])[] = [];
  const mockNavigator = {
    vibrate: (pattern: number | number[]) => {
      calls.push(pattern);
      return true;
    },
  };

  const haptics = new HapticsService(mockNavigator);

  assert.strictEqual(haptics.isSupported(), true);
  assert.strictEqual(haptics.isEnabled(), true);

  // Test play/pause haptic
  const rPlay = haptics.playPause();
  assert.strictEqual(rPlay, true);
  assert.deepStrictEqual(calls[calls.length - 1], HAPTIC_PATTERNS.playPause);

  // Test trackChange haptic
  const rTrack = haptics.trackChange();
  assert.strictEqual(rTrack, true);
  assert.deepStrictEqual(calls[calls.length - 1], HAPTIC_PATTERNS.trackChange);

  // Test favorite haptic
  const rFav = haptics.favorite();
  assert.strictEqual(rFav, true);
  assert.deepStrictEqual(calls[calls.length - 1], HAPTIC_PATTERNS.favorite);

  // Test bass impact haptic
  const rBass = haptics.bassImpact();
  assert.strictEqual(rBass, true);
  assert.deepStrictEqual(calls[calls.length - 1], HAPTIC_PATTERNS.bassImpact);

  // Test disabling haptics
  haptics.setEnabled(false);
  assert.strictEqual(haptics.isEnabled(), false);
  const rDisabled = haptics.playPause();
  assert.strictEqual(rDisabled, false);
  // No new calls added when disabled
  assert.strictEqual(calls.length, 4);

  // Test re-enabling
  haptics.setEnabled(true);
  assert.strictEqual(haptics.isEnabled(), true);
  haptics.light();
  assert.strictEqual(calls.length, 5);
  assert.deepStrictEqual(calls[calls.length - 1], HAPTIC_PATTERNS.light);
});

test('HapticsService handles unsupported environments gracefully', () => {
  const haptics = new HapticsService(undefined);
  assert.strictEqual(haptics.isSupported(), false);

  // Calling vibrate or playPause should not throw, returns false
  assert.strictEqual(haptics.playPause(), false);
  assert.strictEqual(haptics.trackChange(), false);
  assert.strictEqual(haptics.vibrate(50), false);
});

test('HapticsService handles vibrate throwing security exception safely', () => {
  const mockThrowingNav = {
    vibrate: () => {
      throw new Error('SecurityError: Vibration blocked');
    },
  };

  const haptics = new HapticsService(mockThrowingNav);
  assert.strictEqual(haptics.isSupported(), true);
  // Does not throw and returns false
  assert.strictEqual(haptics.playPause(), false);
});
