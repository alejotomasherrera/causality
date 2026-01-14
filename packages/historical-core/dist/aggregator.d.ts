/**
 * @causality/historical-core — Aggregator
 *
 * Aggregates enriched explanations into historical statistics.
 */
import type { EnrichedExplanation } from '@causality/code-tracing-core';
import type { AggregatedStats, HistoricalConfig } from './types.js';
export declare const DEFAULT_HISTORY_SIZE = 50;
/**
 * Historical Data Aggregator.
 */
export declare class Aggregator {
    private readonly statsMap;
    private readonly config;
    constructor(config?: HistoricalConfig);
    /**
     * Process a new trace and update statistics.
     */
    process(trace: EnrichedExplanation): void;
    /**
     * Get stats for a specific microservice and function.
     */
    getStats(service: string, functionName: string, actionName: string): AggregatedStats | undefined;
    /**
     * Get all aggregated statistics.
     */
    getAllStats(): AggregatedStats[];
    /**
     * Serialize aggregation key.
     */
    private serializeKey;
    /**
     * Extract aggregation key from trace.
     */
    private getAggregationKey;
    /**
     * Create historical record from trace.
     */
    private createRecord;
    /**
     * Initialize new stats object.
     */
    private initializeStats;
    /**
     * Update existing stats with new record.
     */
    private updateStats;
    /**
     * Clear all statistics.
     */
    clear(): void;
}
//# sourceMappingURL=aggregator.d.ts.map