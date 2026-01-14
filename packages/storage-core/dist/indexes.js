/**
 * @causality/storage-core — Indexes
 *
 * In-memory indexing for fast trace lookups.
 * No external dependencies — pure data structures.
 */
import { extractActionNames } from './serializers.js';
/**
 * In-memory index for trace lookups.
 */
export class TraceIndex {
    /** Primary index: traceId → entry */
    byId = new Map();
    /** Secondary index: status → traceIds */
    byStatus = new Map();
    /** Secondary index: actionName → traceIds */
    byActionName = new Map();
    /** Secondary index: duration bucket → traceIds */
    byDurationBucket = new Map();
    /**
     * Add a trace to the index.
     */
    add(trace) {
        const actionNames = extractActionNames(trace);
        const entry = {
            traceId: trace.traceId,
            status: trace.status,
            startTime: trace.startTime,
            durationMs: trace.durationMs,
            actionNames,
        };
        // Primary index
        this.byId.set(trace.traceId, entry);
        // Status index
        this.addToSetIndex(this.byStatus, trace.status, trace.traceId);
        // Action name index
        for (const name of actionNames) {
            this.addToSetIndex(this.byActionName, name, trace.traceId);
        }
        // Duration bucket index
        if (trace.durationMs !== undefined) {
            const bucket = this.getDurationBucket(trace.durationMs);
            this.addToSetIndex(this.byDurationBucket, bucket, trace.traceId);
        }
    }
    /**
     * Remove a trace from the index.
     */
    remove(traceId) {
        const entry = this.byId.get(traceId);
        if (!entry)
            return false;
        // Remove from primary
        this.byId.delete(traceId);
        // Remove from status index
        this.removeFromSetIndex(this.byStatus, entry.status, traceId);
        // Remove from action name index
        for (const name of entry.actionNames) {
            this.removeFromSetIndex(this.byActionName, name, traceId);
        }
        // Remove from duration bucket
        if (entry.durationMs !== undefined) {
            const bucket = this.getDurationBucket(entry.durationMs);
            this.removeFromSetIndex(this.byDurationBucket, bucket, traceId);
        }
        return true;
    }
    /**
     * Get index entry by traceId.
     */
    get(traceId) {
        return this.byId.get(traceId);
    }
    /**
     * Get all traceIds with a specific status.
     */
    getByStatus(status) {
        return this.byStatus.get(status) ?? new Set();
    }
    /**
     * Get all traceIds containing a specific action.
     */
    getByActionName(actionName) {
        return this.byActionName.get(actionName) ?? new Set();
    }
    /**
     * Get all traceIds in a duration range.
     */
    getByDurationRange(minMs, maxMs) {
        const result = new Set();
        for (const entry of this.byId.values()) {
            if (entry.durationMs === undefined)
                continue;
            const meetsMin = minMs === undefined || entry.durationMs >= minMs;
            const meetsMax = maxMs === undefined || entry.durationMs <= maxMs;
            if (meetsMin && meetsMax) {
                result.add(entry.traceId);
            }
        }
        return result;
    }
    /**
     * Get all traceIds in a time range.
     */
    getByTimeRange(from, to) {
        const result = new Set();
        for (const entry of this.byId.values()) {
            const meetsFrom = from === undefined || entry.startTime >= from;
            const meetsTo = to === undefined || entry.startTime <= to;
            if (meetsFrom && meetsTo) {
                result.add(entry.traceId);
            }
        }
        return result;
    }
    /**
     * Get all indexed traceIds.
     */
    getAllIds() {
        return new Set(this.byId.keys());
    }
    /**
     * Get index statistics.
     */
    stats() {
        const byStatus = {};
        for (const [status, ids] of this.byStatus) {
            byStatus[status] = ids.size;
        }
        return {
            totalTraces: this.byId.size,
            byStatus,
            uniqueActions: this.byActionName.size,
        };
    }
    /**
     * Clear all indexes.
     */
    clear() {
        this.byId.clear();
        this.byStatus.clear();
        this.byActionName.clear();
        this.byDurationBucket.clear();
    }
    // --- Private helpers ---
    addToSetIndex(index, key, value) {
        let set = index.get(key);
        if (!set) {
            set = new Set();
            index.set(key, set);
        }
        set.add(value);
    }
    removeFromSetIndex(index, key, value) {
        const set = index.get(key);
        if (set) {
            set.delete(value);
            if (set.size === 0) {
                index.delete(key);
            }
        }
    }
    getDurationBucket(durationMs) {
        // Logarithmic buckets: <10ms, <100ms, <1s, <10s, >=10s
        if (durationMs < 10)
            return 'fast';
        if (durationMs < 100)
            return 'normal';
        if (durationMs < 1000)
            return 'slow';
        if (durationMs < 10000)
            return 'very-slow';
        return 'critical';
    }
}
//# sourceMappingURL=indexes.js.map