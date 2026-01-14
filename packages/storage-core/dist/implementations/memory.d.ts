/**
 * @causality/storage-core — InMemoryStorage
 *
 * In-memory storage implementation.
 * Fast, indexed, suitable for development and testing.
 */
import type { CausalityTrace, TraceStorage } from '../types.js';
import { TraceIndex } from '../indexes.js';
/**
 * In-memory storage with indexing.
 */
export declare class InMemoryStorage implements TraceStorage {
    private readonly traces;
    private readonly index;
    /**
     * Save a trace to memory.
     */
    save(trace: CausalityTrace): Promise<void>;
    /**
     * Get a trace by ID.
     */
    get(traceId: string): Promise<CausalityTrace | null>;
    /**
     * Iterate over all traces.
     */
    list(): AsyncIterable<CausalityTrace>;
    /**
     * Delete a trace by ID.
     */
    delete(traceId: string): Promise<boolean>;
    /**
     * Get count of stored traces.
     */
    count(): Promise<number>;
    /**
     * Close storage (no-op for memory).
     */
    close(): Promise<void>;
    /**
     * Get the underlying index for queries.
     */
    getIndex(): TraceIndex;
    /**
     * Clear all traces.
     */
    clear(): void;
    /**
     * Get traces by IDs (batch).
     */
    getMany(traceIds: Iterable<string>): Promise<CausalityTrace[]>;
}
//# sourceMappingURL=memory.d.ts.map