/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HapticType =
  | 'light'
  | 'playPause'
  | 'trackChange'
  | 'favorite'
  | 'bassImpact'
  | 'selection'
  | 'warning';

export const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  selection: 14,
  playPause: 22,
  trackChange: [15, 30, 20],
  favorite: [12, 35, 25],
  bassImpact: 35,
  warning: [30, 40, 30],
};

export class HapticsService {
  private enabled: boolean = true;
  private customNavigator?: { vibrate?: (pattern: number | number[]) => boolean };

  constructor(customNavigator?: { vibrate?: (pattern: number | number[]) => boolean }) {
    this.customNavigator = customNavigator;
  }

  /**
   * Sets custom navigator instance (used for testing or dependency injection)
   */
  public setNavigator(nav: { vibrate?: (pattern: number | number[]) => boolean } | undefined): void {
    this.customNavigator = nav;
  }

  /**
   * Returns whether Vibration API is supported on this browser/device
   */
  public isSupported(): boolean {
    const nav = this.getNavigator();
    return typeof nav !== 'undefined' && typeof nav.vibrate === 'function';
  }

  /**
   * Gets current user preference for haptic feedback
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Toggles or sets user preference for haptic feedback
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Triggers a defined haptic pattern
   */
  public trigger(type: HapticType): boolean {
    if (!this.enabled) return false;
    const pattern = HAPTIC_PATTERNS[type] ?? 15;
    return this.vibrate(pattern);
  }

  /**
   * Triggers vibration for playback toggle (play/pause)
   */
  public playPause(): boolean {
    return this.trigger('playPause');
  }

  /**
   * Triggers vibration for changing tracks (next/previous/select track)
   */
  public trackChange(): boolean {
    return this.trigger('trackChange');
  }

  /**
   * Triggers vibration for favoriting a track
   */
  public favorite(): boolean {
    return this.trigger('favorite');
  }

  /**
   * Triggers vibration for bass boost or audio effect engagement
   */
  public bassImpact(): boolean {
    return this.trigger('bassImpact');
  }

  /**
   * Triggers subtle tactile tick for general navigation or button tap
   */
  public light(): boolean {
    return this.trigger('light');
  }

  /**
   * Low-level method to invoke navigator.vibrate safely
   */
  public vibrate(pattern: number | number[]): boolean {
    if (!this.enabled) return false;
    try {
      const nav = this.getNavigator();
      if (nav && typeof nav.vibrate === 'function') {
        return nav.vibrate(pattern);
      }
    } catch {
      // In certain iframe contexts or restricted browsers, vibrate may throw a SecurityError
    }
    return false;
  }

  private getNavigator(): { vibrate?: (pattern: number | number[]) => boolean } | undefined {
    if (this.customNavigator) return this.customNavigator;
    if (typeof window !== 'undefined' && window.navigator) {
      return window.navigator;
    }
    return undefined;
  }
}

export const hapticsService = new HapticsService();
