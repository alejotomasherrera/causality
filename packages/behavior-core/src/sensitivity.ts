/**
 * @causality/behavior-core — Sensitivity Classifier
 *
 * Classify anomalies by repeat sensitivity.
 * Single occurrences are ignored; repeated patterns are flagged.
 */

import type { RepeatSensitivity } from './types.js';

/**
 * Classify repeat sensitivity based on occurrence count and confidence.
 */
export function classifySensitivity(
  occurrenceCount: number,
  confidence: number,
  minOccurrencesToFlag: number,
  confidenceThreshold: number
): RepeatSensitivity {
  // Single occurrence → ignore
  if (occurrenceCount < minOccurrencesToFlag) {
    return 'singleOccurrence';
  }

  // Low confidence → ignore even with multiple occurrences
  if (confidence < confidenceThreshold) {
    return 'singleOccurrence';
  }

  // Repeated with high confidence → flag for review
  return 'flag';
}

/**
 * Check if an anomaly should be flagged for human review.
 */
export function shouldFlagForReview(
  sensitivity: RepeatSensitivity,
  observedAnomaly: boolean
): boolean {
  return observedAnomaly && sensitivity === 'flag';
}

/**
 * Get description of sensitivity classification.
 */
export function describeSensitivity(
  sensitivity: RepeatSensitivity,
  occurrenceCount: number
): string {
  switch (sensitivity) {
    case 'singleOccurrence':
      if (occurrenceCount === 1) {
        return 'Single occurrence, ignoring until pattern emerges';
      }
      return `${occurrenceCount} occurrences, but confidence too low to flag`;

    case 'flag':
      return `Flagged for review: ${occurrenceCount} occurrences with consistent pattern`;
  }
}

/**
 * Track occurrence count for an action.
 */
export class OccurrenceTracker {
  private readonly counts: Map<string, number> = new Map();
  private readonly timestamps: Map<string, number[]> = new Map();
  private readonly windowMs: number;

  constructor(windowMs: number = 3600000) { // 1 hour default
    this.windowMs = windowMs;
  }

  /**
   * Record an occurrence of an anomaly.
   */
  record(actionName: string, timestamp: number = Date.now()): void {
    // Increment count
    const current = this.counts.get(actionName) ?? 0;
    this.counts.set(actionName, current + 1);

    // Track timestamp
    const timestamps = this.timestamps.get(actionName) ?? [];
    timestamps.push(timestamp);
    this.timestamps.set(actionName, timestamps);

    // Cleanup old timestamps
    this.cleanup(actionName, timestamp);
  }

  /**
   * Get occurrence count for an action.
   */
  getCount(actionName: string): number {
    return this.counts.get(actionName) ?? 0;
  }

  /**
   * Get occurrence count within the time window.
   */
  getRecentCount(actionName: string, now: number = Date.now()): number {
    const timestamps = this.timestamps.get(actionName) ?? [];
    const cutoff = now - this.windowMs;
    return timestamps.filter((t) => t >= cutoff).length;
  }

  /**
   * Reset count for an action.
   */
  reset(actionName: string): void {
    this.counts.delete(actionName);
    this.timestamps.delete(actionName);
  }

  /**
   * Reset all counts.
   */
  resetAll(): void {
    this.counts.clear();
    this.timestamps.clear();
  }

  /**
   * Cleanup old timestamps outside the window.
   */
  private cleanup(actionName: string, now: number): void {
    const timestamps = this.timestamps.get(actionName);
    if (!timestamps) return;

    const cutoff = now - this.windowMs;
    const filtered = timestamps.filter((t) => t >= cutoff);
    this.timestamps.set(actionName, filtered);
  }
}

/**
 * Create an occurrence tracker.
 */
export function createOccurrenceTracker(windowMs?: number): OccurrenceTracker {
  return new OccurrenceTracker(windowMs);
}
