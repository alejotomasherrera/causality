/**
 * @causality/storage-core — Repository
 *
 * Query layer for traces.
 * Separates query logic from storage implementation.
 */

import type {
  CausalityTrace,
  CausalityActionNode,
  TraceQuery,
  CombinedQuery,
  ActionQuery,
  TraceRepository as ITraceRepository,
} from './types.js';
import { TraceIndex } from './indexes.js';
import { hasMatchingAction, findAllActions } from './serializers.js';
import { InMemoryStorage } from './implementations/memory.js';
import { JSONLStorage } from './implementations/jsonl.js';

/**
 * Storage with index access.
 */
interface IndexedStorage {
  get(traceId: string): Promise<CausalityTrace | null>;
  getMany(traceIds: Iterable<string>): Promise<CausalityTrace[]>;
  list(): AsyncIterable<CausalityTrace>;
  getIndex(): TraceIndex;
}

/**
 * Repository for querying traces.
 */
export class TraceRepository implements ITraceRepository {
  private readonly storage: IndexedStorage;

  constructor(storage: InMemoryStorage | JSONLStorage) {
    this.storage = storage;
  }

  /**
   * Query traces with filters.
   */
  async query(q: TraceQuery): Promise<CausalityTrace[]> {
    const index = this.storage.getIndex();
    let candidateIds: Set<string> | null = null;

    // Build candidate set using indexes
    if (q.traceId) {
      // Exact match
      const trace = await this.storage.get(q.traceId);
      if (trace && this.matchesQuery(trace, q)) {
        return [trace];
      }
      return [];
    }

    // Status filter
    if (q.status) {
      const statusIds = index.getByStatus(q.status);
      candidateIds = this.intersect(candidateIds, statusIds);
    }

    // Action name filter
    if (q.actionName) {
      const actionIds = index.getByActionName(q.actionName);
      candidateIds = this.intersect(candidateIds, actionIds);
    }

    // Duration filter
    if (q.minDurationMs !== undefined || q.maxDurationMs !== undefined) {
      const durationIds = index.getByDurationRange(q.minDurationMs, q.maxDurationMs);
      candidateIds = this.intersect(candidateIds, durationIds);
    }

    // Time range filter
    if (q.from !== undefined || q.to !== undefined) {
      const timeIds = index.getByTimeRange(q.from, q.to);
      candidateIds = this.intersect(candidateIds, timeIds);
    }

    // If no filters, get all
    if (candidateIds === null) {
      candidateIds = index.getAllIds();
    }

    // Fetch traces
    let traces = await this.storage.getMany(candidateIds);

    // Apply any remaining filters that couldn't use indexes
    traces = traces.filter((t) => this.matchesQuery(t, q));

    // Sort
    if (q.orderBy) {
      traces = this.sortTraces(traces, q.orderBy, q.order ?? 'asc');
    }

    // Limit
    if (q.limit !== undefined && traces.length > q.limit) {
      traces = traces.slice(0, q.limit);
    }

    return traces;
  }

  /**
   * Advanced query with action-level filtering.
   */
  async queryWithActions(q: CombinedQuery): Promise<CausalityTrace[]> {
    // First, apply trace-level filters
    let traces = await this.query(q);

    // Then filter by action criteria
    if (q.actionFilter) {
      traces = traces.filter((t) => this.hasMatchingActionFilter(t, q.actionFilter!));
    }

    return traces;
  }

  /**
   * Find traces containing a specific action by name.
   */
  async findByAction(actionName: string): Promise<CausalityTrace[]> {
    return this.query({ actionName });
  }

  /**
   * Find failed traces within a time range.
   */
  async findFailed(from?: number, to?: number): Promise<CausalityTrace[]> {
    return this.query({
      status: 'error',
      from,
      to,
      orderBy: 'startTime',
      order: 'desc',
    });
  }

  /**
   * Find slow traces (duration above threshold).
   */
  async findSlow(minDurationMs: number): Promise<CausalityTrace[]> {
    return this.query({
      minDurationMs,
      orderBy: 'duration',
      order: 'desc',
    });
  }

  /**
   * Find traces where a specific action is slow.
   */
  async findSlowAction(
    actionName: string,
    minDurationMs: number
  ): Promise<CausalityTrace[]> {
    return this.queryWithActions({
      actionName,
      actionFilter: {
        name: actionName,
        minDurationMs,
      },
    });
  }

  /**
   * Find failed traces where a specific action failed.
   */
  async findFailedAction(actionName: string): Promise<CausalityTrace[]> {
    return this.queryWithActions({
      status: 'error',
      actionName,
      actionFilter: {
        name: actionName,
        status: 'error',
      },
    });
  }

  // --- Private helpers ---

  private intersect(
    a: Set<string> | null,
    b: Set<string>
  ): Set<string> {
    if (a === null) return new Set(b);

    const result = new Set<string>();
    for (const id of a) {
      if (b.has(id)) {
        result.add(id);
      }
    }
    return result;
  }

  private matchesQuery(trace: CausalityTrace, q: TraceQuery): boolean {
    if (q.status && trace.status !== q.status) return false;

    if (q.minDurationMs !== undefined) {
      if (trace.durationMs === undefined || trace.durationMs < q.minDurationMs) {
        return false;
      }
    }

    if (q.maxDurationMs !== undefined) {
      if (trace.durationMs === undefined || trace.durationMs > q.maxDurationMs) {
        return false;
      }
    }

    if (q.from !== undefined && trace.startTime < q.from) return false;
    if (q.to !== undefined && trace.startTime > q.to) return false;

    return true;
  }

  private hasMatchingActionFilter(
    trace: CausalityTrace,
    filter: ActionQuery
  ): boolean {
    return hasMatchingAction(trace, (action) => {
      if (filter.name && action.name !== filter.name) return false;
      if (filter.status && action.status !== filter.status) return false;

      if (filter.minDurationMs !== undefined) {
        if (action.durationMs === undefined || action.durationMs < filter.minDurationMs) {
          return false;
        }
      }

      if (filter.maxDurationMs !== undefined) {
        if (action.durationMs === undefined || action.durationMs > filter.maxDurationMs) {
          return false;
        }
      }

      return true;
    });
  }

  private sortTraces(
    traces: CausalityTrace[],
    orderBy: 'startTime' | 'duration',
    order: 'asc' | 'desc'
  ): CausalityTrace[] {
    const sorted = [...traces];
    const multiplier = order === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      if (orderBy === 'startTime') {
        return (a.startTime - b.startTime) * multiplier;
      } else {
        const aDur = a.durationMs ?? 0;
        const bDur = b.durationMs ?? 0;
        return (aDur - bDur) * multiplier;
      }
    });

    return sorted;
  }
}
