/**
 * @causality/storage-core — Repository
 *
 * Query layer for traces.
 * Separates query logic from storage implementation.
 */
import type { CausalityTrace, TraceQuery, CombinedQuery, TraceRepository as ITraceRepository } from './types.js';
import { InMemoryStorage } from './implementations/memory.js';
import { JSONLStorage } from './implementations/jsonl.js';
/**
 * Repository for querying traces.
 */
export declare class TraceRepository implements ITraceRepository {
    private readonly storage;
    constructor(storage: InMemoryStorage | JSONLStorage);
    /**
     * Query traces with filters.
     */
    query(q: TraceQuery): Promise<CausalityTrace[]>;
    /**
     * Advanced query with action-level filtering.
     */
    queryWithActions(q: CombinedQuery): Promise<CausalityTrace[]>;
    /**
     * Find traces containing a specific action by name.
     */
    findByAction(actionName: string): Promise<CausalityTrace[]>;
    /**
     * Find failed traces within a time range.
     */
    findFailed(from?: number, to?: number): Promise<CausalityTrace[]>;
    /**
     * Find slow traces (duration above threshold).
     */
    findSlow(minDurationMs: number): Promise<CausalityTrace[]>;
    /**
     * Find traces where a specific action is slow.
     */
    findSlowAction(actionName: string, minDurationMs: number): Promise<CausalityTrace[]>;
    /**
     * Find failed traces where a specific action failed.
     */
    findFailedAction(actionName: string): Promise<CausalityTrace[]>;
    private intersect;
    private matchesQuery;
    private hasMatchingActionFilter;
    private sortTraces;
}
//# sourceMappingURL=repository.d.ts.map