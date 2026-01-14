/**
 * @causality/storage-core — Repository
 *
 * Query layer for traces.
 * Separates query logic from storage implementation.
 */
import { hasMatchingAction } from './serializers.js';
/**
 * Repository for querying traces.
 */
export class TraceRepository {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    /**
     * Query traces with filters.
     */
    async query(q) {
        const index = this.storage.getIndex();
        let candidateIds = null;
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
    async queryWithActions(q) {
        // First, apply trace-level filters
        let traces = await this.query(q);
        // Then filter by action criteria
        if (q.actionFilter) {
            traces = traces.filter((t) => this.hasMatchingActionFilter(t, q.actionFilter));
        }
        return traces;
    }
    /**
     * Find traces containing a specific action by name.
     */
    async findByAction(actionName) {
        return this.query({ actionName });
    }
    /**
     * Find failed traces within a time range.
     */
    async findFailed(from, to) {
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
    async findSlow(minDurationMs) {
        return this.query({
            minDurationMs,
            orderBy: 'duration',
            order: 'desc',
        });
    }
    /**
     * Find traces where a specific action is slow.
     */
    async findSlowAction(actionName, minDurationMs) {
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
    async findFailedAction(actionName) {
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
    intersect(a, b) {
        if (a === null)
            return new Set(b);
        const result = new Set();
        for (const id of a) {
            if (b.has(id)) {
                result.add(id);
            }
        }
        return result;
    }
    matchesQuery(trace, q) {
        if (q.status && trace.status !== q.status)
            return false;
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
        if (q.from !== undefined && trace.startTime < q.from)
            return false;
        if (q.to !== undefined && trace.startTime > q.to)
            return false;
        return true;
    }
    hasMatchingActionFilter(trace, filter) {
        return hasMatchingAction(trace, (action) => {
            if (filter.name && action.name !== filter.name)
                return false;
            if (filter.status && action.status !== filter.status)
                return false;
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
    sortTraces(traces, orderBy, order) {
        const sorted = [...traces];
        const multiplier = order === 'asc' ? 1 : -1;
        sorted.sort((a, b) => {
            if (orderBy === 'startTime') {
                return (a.startTime - b.startTime) * multiplier;
            }
            else {
                const aDur = a.durationMs ?? 0;
                const bDur = b.durationMs ?? 0;
                return (aDur - bDur) * multiplier;
            }
        });
        return sorted;
    }
}
//# sourceMappingURL=repository.js.map