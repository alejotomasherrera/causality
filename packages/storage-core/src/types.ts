/**
 * @causality/storage-core — Type Definitions
 *
 * Types for trace storage, querying, and indexing.
 */

import type { CausalityTrace, CausalityActionNode } from '@causality/collector-core';

// Re-export for convenience
export type { CausalityTrace, CausalityActionNode };

/**
 * Query parameters for filtering traces.
 */
export interface TraceQuery {
  /** Filter by exact traceId */
  readonly traceId?: string;

  /** Filter by trace status */
  readonly status?: 'ok' | 'error' | 'partial';

  /** Filter traces containing an action with this name */
  readonly actionName?: string;

  /** Filter traces with duration >= this value (ms) */
  readonly minDurationMs?: number;

  /** Filter traces with duration <= this value (ms) */
  readonly maxDurationMs?: number;

  /** Filter traces starting at or after this timestamp (ms) */
  readonly from?: number;

  /** Filter traces starting at or before this timestamp (ms) */
  readonly to?: number;

  /** Maximum number of results to return */
  readonly limit?: number;

  /** Sort order for results */
  readonly orderBy?: 'startTime' | 'duration';

  /** Sort direction */
  readonly order?: 'asc' | 'desc';
}

/**
 * Advanced query for actions within traces.
 */
export interface ActionQuery {
  /** Action name to search for */
  readonly name?: string;

  /** Action status */
  readonly status?: 'ok' | 'error' | 'incomplete';

  /** Min duration for the action (ms) */
  readonly minDurationMs?: number;

  /** Max duration for the action (ms) */
  readonly maxDurationMs?: number;
}

/**
 * Combined query: trace-level + action-level filters.
 */
export interface CombinedQuery extends TraceQuery {
  /** Filter traces containing actions matching this criteria */
  readonly actionFilter?: ActionQuery;
}

/**
 * Storage interface for persisting traces.
 * Handles save/load operations only — no queries.
 */
export interface TraceStorage {
  /**
   * Save a trace to storage.
   */
  save(trace: CausalityTrace): Promise<void>;

  /**
   * Get a trace by ID.
   */
  get(traceId: string): Promise<CausalityTrace | null>;

  /**
   * Iterate over all stored traces.
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
   * Close storage and release resources.
   */
  close(): Promise<void>;
}

/**
 * Repository interface for querying traces.
 * Separates query logic from storage implementation.
 */
export interface TraceRepository {
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
}

/**
 * Index entry for trace lookups.
 */
export interface TraceIndexEntry {
  readonly traceId: string;
  readonly status: 'ok' | 'error' | 'partial';
  readonly startTime: number;
  readonly durationMs?: number;
  readonly actionNames: Set<string>;
}

/**
 * Storage statistics.
 */
export interface StorageStats {
  traceCount: number;
  byStatus: {
    ok: number;
    error: number;
    partial: number;
  };
  oldestTrace?: number;
  newestTrace?: number;
}
