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
export declare function classifySensitivity(occurrenceCount: number, confidence: number, minOccurrencesToFlag: number, confidenceThreshold: number): RepeatSensitivity;
/**
 * Check if an anomaly should be flagged for human review.
 */
export declare function shouldFlagForReview(sensitivity: RepeatSensitivity, observedAnomaly: boolean): boolean;
/**
 * Get description of sensitivity classification.
 */
export declare function describeSensitivity(sensitivity: RepeatSensitivity, occurrenceCount: number): string;
/**
 * Track occurrence count for an action.
 */
export declare class OccurrenceTracker {
    private readonly counts;
    private readonly timestamps;
    private readonly windowMs;
    constructor(windowMs?: number);
    /**
     * Record an occurrence of an anomaly.
     */
    record(actionName: string, timestamp?: number): void;
    /**
     * Get occurrence count for an action.
     */
    getCount(actionName: string): number;
    /**
     * Get occurrence count within the time window.
     */
    getRecentCount(actionName: string, now?: number): number;
    /**
     * Reset count for an action.
     */
    reset(actionName: string): void;
    /**
     * Reset all counts.
     */
    resetAll(): void;
    /**
     * Cleanup old timestamps outside the window.
     */
    private cleanup;
}
/**
 * Create an occurrence tracker.
 */
export declare function createOccurrenceTracker(windowMs?: number): OccurrenceTracker;
//# sourceMappingURL=sensitivity.d.ts.map