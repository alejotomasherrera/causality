/**
 * @causality/storage-core — Indexes
 *
 * In-memory indexing for fast trace lookups.
 * No external dependencies — pure data structures.
 */
import type { CausalityTrace, TraceIndexEntry } from './types.js';
/**
 * In-memory index for trace lookups.
 */
export declare class TraceIndex {
    /** Primary index: traceId → entry */
    private readonly byId;
    /** Secondary index: status → traceIds */
    private readonly byStatus;
    /** Secondary index: actionName → traceIds */
    private readonly byActionName;
    /** Secondary index: duration bucket → traceIds */
    private readonly byDurationBucket;
    /**
     * Add a trace to the index.
     */
    add(trace: CausalityTrace): void;
    /**
     * Remove a trace from the index.
     */
    remove(traceId: string): boolean;
    /**
     * Get index entry by traceId.
     */
    get(traceId: string): TraceIndexEntry | undefined;
    /**
     * Get all traceIds with a specific status.
     */
    getByStatus(status: 'ok' | 'error' | 'partial'): Set<string>;
    /**
     * Get all traceIds containing a specific action.
     */
    getByActionName(actionName: string): Set<string>;
    /**
     * Get all traceIds in a duration range.
     */
    getByDurationRange(minMs?: number, maxMs?: number): Set<string>;
    /**
     * Get all traceIds in a time range.
     */
    getByTimeRange(from?: number, to?: number): Set<string>;
    /**
     * Get all indexed traceIds.
     */
    getAllIds(): Set<string>;
    /**
     * Get index statistics.
     */
    stats(): {
        totalTraces: number;
        byStatus: Record<string, number>;
        uniqueActions: number;
    };
    /**
     * Clear all indexes.
     */
    clear(): void;
    private addToSetIndex;
    private removeFromSetIndex;
    private getDurationBucket;
}
//# sourceMappingURL=indexes.d.ts.map