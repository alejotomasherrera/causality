/**
 * @causality/behavior-core — Execution History
 *
 * Store and query historical execution data for actions.
 * Maintains running statistics without storing individual samples.
 */
/**
 * In-memory store for execution history.
 */
export class ExecutionHistoryStore {
    histories = new Map();
    /**
     * Record a new execution for an action.
     */
    record(metrics) {
        const key = metrics.name;
        let history = this.histories.get(key);
        if (!history) {
            history = createEmptyHistory(key);
            this.histories.set(key, history);
        }
        // Update running statistics
        updateStats(history.duration, metrics.durationMs);
        updateStats(history.cpu, metrics.metrics.delta.cpuDelta);
        updateStats(history.memory, metrics.metrics.delta.memoryDeltaMb);
        history.sampleCount++;
        history.lastUpdated = Date.now();
    }
    /**
     * Get history for an action.
     */
    get(actionName) {
        const history = this.histories.get(actionName);
        if (!history)
            return undefined;
        return {
            actionName,
            sampleCount: history.sampleCount,
            lastUpdated: history.lastUpdated,
            stats: {
                duration: finalizeStats(history.duration),
                cpu: finalizeStats(history.cpu),
                memory: finalizeStats(history.memory),
            },
        };
    }
    /**
     * Check if we have enough history for reliable analysis.
     */
    hasReliableHistory(actionName, minSamples) {
        const history = this.histories.get(actionName);
        return history !== undefined && history.sampleCount >= minSamples;
    }
    /**
     * Get all action names with history.
     */
    getActionNames() {
        return Array.from(this.histories.keys());
    }
    /**
     * Clear history for an action.
     */
    clear(actionName) {
        this.histories.delete(actionName);
    }
    /**
     * Clear all history.
     */
    clearAll() {
        this.histories.clear();
    }
    /**
     * Export history for persistence.
     */
    export() {
        return this.getActionNames()
            .map((name) => this.get(name))
            .filter(Boolean);
    }
    /**
     * Import history from persistence.
     */
    import(histories) {
        for (const history of histories) {
            this.histories.set(history.actionName, {
                sampleCount: history.sampleCount,
                lastUpdated: history.lastUpdated,
                duration: mutableFromStats(history.stats.duration),
                cpu: mutableFromStats(history.stats.cpu),
                memory: mutableFromStats(history.stats.memory),
            });
        }
    }
}
function createEmptyHistory(actionName) {
    return {
        sampleCount: 0,
        lastUpdated: Date.now(),
        duration: createEmptyStats(),
        cpu: createEmptyStats(),
        memory: createEmptyStats(),
    };
}
function createEmptyStats() {
    return {
        sum: 0,
        sumSquares: 0,
        min: Infinity,
        max: -Infinity,
        samples: [],
    };
}
const MAX_SAMPLES_FOR_PERCENTILES = 1000;
function updateStats(stats, value) {
    stats.sum += value;
    stats.sumSquares += value * value;
    stats.min = Math.min(stats.min, value);
    stats.max = Math.max(stats.max, value);
    // Maintain circular buffer for percentile calculation
    if (stats.samples.length < MAX_SAMPLES_FOR_PERCENTILES) {
        stats.samples.push(value);
    }
    else {
        // Replace oldest sample (simple circular behavior)
        const index = Math.floor(Math.random() * MAX_SAMPLES_FOR_PERCENTILES);
        stats.samples[index] = value;
    }
}
function finalizeStats(stats) {
    const n = stats.samples.length;
    if (n === 0) {
        return {
            mean: 0,
            stdDev: 0,
            min: 0,
            max: 0,
            p50: 0,
            p95: 0,
            p99: 0,
        };
    }
    const mean = stats.sum / n;
    const variance = stats.sumSquares / n - mean * mean;
    const stdDev = Math.sqrt(Math.max(0, variance));
    // Sort for percentiles
    const sorted = [...stats.samples].sort((a, b) => a - b);
    return {
        mean,
        stdDev,
        min: stats.min === Infinity ? 0 : stats.min,
        max: stats.max === -Infinity ? 0 : stats.max,
        p50: percentile(sorted, 0.5),
        p95: percentile(sorted, 0.95),
        p99: percentile(sorted, 0.99),
    };
}
function percentile(sorted, p) {
    if (sorted.length === 0)
        return 0;
    const index = Math.ceil(p * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}
function mutableFromStats(stats) {
    // Reconstruct mutable stats from finalized stats
    // Note: This is an approximation for import purposes
    const n = 1; // We don't know original sample count, use 1
    return {
        sum: stats.mean * n,
        sumSquares: (stats.stdDev * stats.stdDev + stats.mean * stats.mean) * n,
        min: stats.min,
        max: stats.max,
        samples: [stats.mean], // Start with single sample at mean
    };
}
/**
 * Create a history store.
 */
export function createHistoryStore() {
    return new ExecutionHistoryStore();
}
//# sourceMappingURL=history.js.map