/**
 * @causality/historical-core — Aggregator
 *
 * Aggregates enriched explanations into historical statistics.
 */
export const DEFAULT_HISTORY_SIZE = 50;
/**
 * Historical Data Aggregator.
 */
export class Aggregator {
    statsMap = new Map();
    config;
    constructor(config) {
        this.config = {
            maxHistorySize: config?.maxHistorySize ?? DEFAULT_HISTORY_SIZE,
            minExecutionsForTrend: config?.minExecutionsForTrend ?? 5,
            recencyWeight: config?.recencyWeight ?? 0.3,
        };
    }
    /**
     * Process a new trace and update statistics.
     */
    process(trace) {
        const key = this.getAggregationKey(trace);
        const keyString = this.serializeKey(key);
        const existingStats = this.statsMap.get(keyString);
        const record = this.createRecord(trace);
        if (existingStats) {
            this.statsMap.set(keyString, this.updateStats(existingStats, record));
        }
        else {
            this.statsMap.set(keyString, this.initializeStats(key, record));
        }
    }
    /**
     * Get stats for a specific microservice and function.
     */
    getStats(service, functionName, actionName) {
        return this.statsMap.get(this.serializeKey({ service, functionName, actionName }));
    }
    /**
     * Get all aggregated statistics.
     */
    getAllStats() {
        return Array.from(this.statsMap.values());
    }
    /**
     * Serialize aggregation key.
     */
    serializeKey(key) {
        return `${key.service}::${key.functionName}::${key.actionName}`;
    }
    /**
     * Extract aggregation key from trace.
     */
    getAggregationKey(trace) {
        return {
            service: trace.serviceName,
            functionName: trace.function,
            actionName: trace.actionName,
        };
    }
    /**
     * Create historical record from trace.
     */
    createRecord(trace) {
        // Determine status based on impact and anomalies
        let status = 'ok';
        // Check for explicit errors in causal chain
        const hasError = trace.causalChain.some(step => step.status === 'error');
        if (hasError) {
            status = 'error';
        }
        // Check for significant anomalies or high impact
        else if (trace.anomalies.length > 0 || trace.impactScore > 50) {
            status = 'degraded';
        }
        // Extract error type if any
        let errorType;
        if (status === 'error') {
            // Simple heuristic: take the most common anomaly reason or a generic error
            errorType = trace.anomalies.length > 0 ? trace.anomalies[0].type : 'UnknownError';
        }
        return {
            traceId: trace.traceId,
            timestamp: trace.generatedAt,
            status,
            metrics: {
                durationMs: trace.metricsObserved.durationMs,
                cpuDelta: trace.metricsObserved.cpuDelta,
                memoryDeltaMb: trace.metricsObserved.memoryDeltaMb,
            },
            errorType,
            anomalies: trace.anomalies.map(a => a.type),
            impactScore: trace.impactScore,
        };
    }
    /**
     * Initialize new stats object.
     */
    initializeStats(key, record) {
        return {
            key,
            totalExecutions: 1,
            totalFailures: record.status === 'error' ? 1 : 0,
            totalDegradations: record.status === 'degraded' ? 1 : 0,
            firstSeen: record.timestamp,
            lastSeen: record.timestamp,
            avgDurationMs: record.metrics.durationMs,
            maxDurationMs: record.metrics.durationMs,
            avgCpuDelta: record.metrics.cpuDelta,
            maxCpuDelta: record.metrics.cpuDelta,
            avgMemoryDeltaMb: record.metrics.memoryDeltaMb,
            maxMemoryDeltaMb: record.metrics.memoryDeltaMb,
            errorCounts: record.errorType ? { [record.errorType]: 1 } : {},
            recentHistory: [record],
        };
    }
    /**
     * Update existing stats with new record.
     */
    updateStats(stats, record) {
        const totalExecutions = stats.totalExecutions + 1;
        // incremental average: new_avg = old_avg + (val - old_avg) / total
        const avgDurationMs = stats.avgDurationMs + (record.metrics.durationMs - stats.avgDurationMs) / totalExecutions;
        const avgCpuDelta = stats.avgCpuDelta + (record.metrics.cpuDelta - stats.avgCpuDelta) / totalExecutions;
        const avgMemoryDeltaMb = stats.avgMemoryDeltaMb + (record.metrics.memoryDeltaMb - stats.avgMemoryDeltaMb) / totalExecutions;
        // Update error counts
        const errorCounts = { ...stats.errorCounts };
        if (record.errorType) {
            errorCounts[record.errorType] = (errorCounts[record.errorType] || 0) + 1;
        }
        // Manage history window
        const recentHistory = [...stats.recentHistory, record];
        if (recentHistory.length > this.config.maxHistorySize) {
            recentHistory.shift(); // Keep latest
        }
        return {
            key: stats.key,
            totalExecutions,
            totalFailures: stats.totalFailures + (record.status === 'error' ? 1 : 0),
            totalDegradations: stats.totalDegradations + (record.status === 'degraded' ? 1 : 0),
            firstSeen: Math.min(stats.firstSeen, record.timestamp),
            lastSeen: Math.max(stats.lastSeen, record.timestamp),
            avgDurationMs,
            maxDurationMs: Math.max(stats.maxDurationMs, record.metrics.durationMs),
            avgCpuDelta,
            maxCpuDelta: Math.max(stats.maxCpuDelta, record.metrics.cpuDelta),
            avgMemoryDeltaMb,
            maxMemoryDeltaMb: Math.max(stats.maxMemoryDeltaMb, record.metrics.memoryDeltaMb),
            errorCounts,
            recentHistory,
        };
    }
    /**
     * Clear all statistics.
     */
    clear() {
        this.statsMap.clear();
    }
}
//# sourceMappingURL=aggregator.js.map