/**
 * @causality/behavior-core — Sensitivity Classifier
 *
 * Classify anomalies by repeat sensitivity.
 * Single occurrences are ignored; repeated patterns are flagged.
 */
/**
 * Classify repeat sensitivity based on occurrence count and confidence.
 */
export function classifySensitivity(occurrenceCount, confidence, minOccurrencesToFlag, confidenceThreshold) {
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
export function shouldFlagForReview(sensitivity, observedAnomaly) {
    return observedAnomaly && sensitivity === 'flag';
}
/**
 * Get description of sensitivity classification.
 */
export function describeSensitivity(sensitivity, occurrenceCount) {
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
    counts = new Map();
    timestamps = new Map();
    windowMs;
    constructor(windowMs = 3600000) {
        this.windowMs = windowMs;
    }
    /**
     * Record an occurrence of an anomaly.
     */
    record(actionName, timestamp = Date.now()) {
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
    getCount(actionName) {
        return this.counts.get(actionName) ?? 0;
    }
    /**
     * Get occurrence count within the time window.
     */
    getRecentCount(actionName, now = Date.now()) {
        const timestamps = this.timestamps.get(actionName) ?? [];
        const cutoff = now - this.windowMs;
        return timestamps.filter((t) => t >= cutoff).length;
    }
    /**
     * Reset count for an action.
     */
    reset(actionName) {
        this.counts.delete(actionName);
        this.timestamps.delete(actionName);
    }
    /**
     * Reset all counts.
     */
    resetAll() {
        this.counts.clear();
        this.timestamps.clear();
    }
    /**
     * Cleanup old timestamps outside the window.
     */
    cleanup(actionName, now) {
        const timestamps = this.timestamps.get(actionName);
        if (!timestamps)
            return;
        const cutoff = now - this.windowMs;
        const filtered = timestamps.filter((t) => t >= cutoff);
        this.timestamps.set(actionName, filtered);
    }
}
/**
 * Create an occurrence tracker.
 */
export function createOccurrenceTracker(windowMs) {
    return new OccurrenceTracker(windowMs);
}
//# sourceMappingURL=sensitivity.js.map