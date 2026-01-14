/**
 * @causality/storage-core — InMemoryStorage
 *
 * In-memory storage implementation.
 * Fast, indexed, suitable for development and testing.
 */
import { TraceIndex } from '../indexes.js';
/**
 * In-memory storage with indexing.
 */
export class InMemoryStorage {
    traces = new Map();
    index = new TraceIndex();
    /**
     * Save a trace to memory.
     */
    async save(trace) {
        // Remove old version if exists
        if (this.traces.has(trace.traceId)) {
            this.index.remove(trace.traceId);
        }
        this.traces.set(trace.traceId, trace);
        this.index.add(trace);
    }
    /**
     * Get a trace by ID.
     */
    async get(traceId) {
        return this.traces.get(traceId) ?? null;
    }
    /**
     * Iterate over all traces.
     */
    async *list() {
        for (const trace of this.traces.values()) {
            yield trace;
        }
    }
    /**
     * Delete a trace by ID.
     */
    async delete(traceId) {
        const existed = this.traces.delete(traceId);
        if (existed) {
            this.index.remove(traceId);
        }
        return existed;
    }
    /**
     * Get count of stored traces.
     */
    async count() {
        return this.traces.size;
    }
    /**
     * Close storage (no-op for memory).
     */
    async close() {
        // No resources to release
    }
    /**
     * Get the underlying index for queries.
     */
    getIndex() {
        return this.index;
    }
    /**
     * Clear all traces.
     */
    clear() {
        this.traces.clear();
        this.index.clear();
    }
    /**
     * Get traces by IDs (batch).
     */
    async getMany(traceIds) {
        const results = [];
        for (const id of traceIds) {
            const trace = this.traces.get(id);
            if (trace) {
                results.push(trace);
            }
        }
        return results;
    }
}
//# sourceMappingURL=memory.js.map