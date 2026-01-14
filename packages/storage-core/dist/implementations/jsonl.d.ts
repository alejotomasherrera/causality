/**
 * @causality/storage-core — JSONLStorage
 *
 * Append-only JSON Lines file storage.
 * Simple, debuggable, zero infrastructure.
 */
import type { CausalityTrace, TraceStorage } from '../types.js';
import { TraceIndex } from '../indexes.js';
/**
 * JSONL file storage with in-memory index.
 *
 * File format: One JSON object per line (newline-delimited JSON)
 * Each line is a complete CausalityTrace.
 */
export declare class JSONLStorage implements TraceStorage {
    private readonly filePath;
    private readonly index;
    private readonly traceCache;
    private writeStream;
    private initialized;
    constructor(filePath: string);
    /**
     * Initialize storage by loading existing file.
     */
    initialize(): Promise<void>;
    /**
     * Save a trace to file (append).
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
     * Note: This only removes from cache/index.
     * The file will still contain the old entry until compaction.
     */
    delete(traceId: string): Promise<boolean>;
    /**
     * Get count of stored traces.
     */
    count(): Promise<number>;
    /**
     * Close storage and flush pending writes.
     */
    close(): Promise<void>;
    /**
     * Get the underlying index for queries.
     */
    getIndex(): TraceIndex;
    /**
     * Compact the file by rewriting only current traces.
     * Removes deleted/overwritten entries.
     */
    compact(): Promise<void>;
    /**
     * Get traces by IDs (batch).
     */
    getMany(traceIds: Iterable<string>): Promise<CausalityTrace[]>;
    private ensureInitialized;
    private loadFromFile;
    private appendToFile;
}
//# sourceMappingURL=jsonl.d.ts.map