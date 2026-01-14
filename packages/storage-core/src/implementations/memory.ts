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
export class InMemoryStorage implements TraceStorage {
  private readonly traces = new Map<string, CausalityTrace>();
  private readonly index = new TraceIndex();

  /**
   * Save a trace to memory.
   */
  async save(trace: CausalityTrace): Promise<void> {
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
  async get(traceId: string): Promise<CausalityTrace | null> {
    return this.traces.get(traceId) ?? null;
  }

  /**
   * Iterate over all traces.
   */
  async *list(): AsyncIterable<CausalityTrace> {
    for (const trace of this.traces.values()) {
      yield trace;
    }
  }

  /**
   * Delete a trace by ID.
   */
  async delete(traceId: string): Promise<boolean> {
    const existed = this.traces.delete(traceId);
    if (existed) {
      this.index.remove(traceId);
    }
    return existed;
  }

  /**
   * Get count of stored traces.
   */
  async count(): Promise<number> {
    return this.traces.size;
  }

  /**
   * Close storage (no-op for memory).
   */
  async close(): Promise<void> {
    // No resources to release
  }

  /**
   * Get the underlying index for queries.
   */
  getIndex(): TraceIndex {
    return this.index;
  }

  /**
   * Clear all traces.
   */
  clear(): void {
    this.traces.clear();
    this.index.clear();
  }

  /**
   * Get traces by IDs (batch).
   */
  async getMany(traceIds: Iterable<string>): Promise<CausalityTrace[]> {
    const results: CausalityTrace[] = [];
    for (const id of traceIds) {
      const trace = this.traces.get(id);
      if (trace) {
        results.push(trace);
      }
    }
    return results;
  }
}
