/**
 * @causality/metrics-core — Correlator
 *
 * Correlates ActionEvents with MetricSnapshots to produce ActionMetrics.
 */
import { ResourceSampler, calculateDelta } from './sampler.js';
/**
 * Correlates actions with metrics.
 * Tracks active actions and captures resource snapshots at start/end.
 */
export class MetricsCorrelator {
    sampler;
    activeActions = new Map();
    completedMetrics = [];
    constructor(sampler) {
        this.sampler = sampler ?? new ResourceSampler();
    }
    /**
     * Process an action event.
     * On action.start: capture start snapshot
     * On action.end: capture end snapshot, compute delta, produce ActionMetrics
     */
    ingest(event) {
        if (event.type === 'action.start') {
            return this.handleStart(event);
        }
        else if (event.type === 'action.end') {
            return this.handleEnd(event);
        }
        return null;
    }
    /**
     * Get all completed action metrics.
     */
    getCompletedMetrics() {
        return [...this.completedMetrics];
    }
    /**
     * Get metrics for a specific action.
     */
    getMetrics(actionId) {
        return this.completedMetrics.find((m) => m.actionId === actionId);
    }
    /**
     * Get metrics for a specific trace.
     */
    getMetricsByTrace(traceId) {
        return this.completedMetrics.filter((m) => m.traceId === traceId);
    }
    /**
     * Clear collected metrics.
     */
    clear() {
        this.activeActions.clear();
        this.completedMetrics.length = 0;
    }
    /**
     * Get count of active (unfinished) actions.
     */
    activeCount() {
        return this.activeActions.size;
    }
    /**
     * Get count of completed metrics.
     */
    completedCount() {
        return this.completedMetrics.length;
    }
    // --- Private handlers ---
    handleStart(event) {
        const { action } = event;
        const snapshot = this.sampler.sample();
        const state = {
            actionId: action.id,
            traceId: action.traceId,
            name: action.name,
            startTime: action.startTime,
            startSnapshot: snapshot,
        };
        this.activeActions.set(action.id, state);
        return null;
    }
    handleEnd(event) {
        const { action } = event;
        const state = this.activeActions.get(action.id);
        if (!state) {
            // End without start - create minimal metrics
            const now = this.sampler.sample();
            const metrics = this.createMetricsFromEndOnly(event, now);
            this.completedMetrics.push(metrics);
            return metrics;
        }
        // Capture end snapshot
        const endSnapshot = this.sampler.sample();
        const delta = calculateDelta(state.startSnapshot, endSnapshot);
        const status = action.status === 'running' ? 'incomplete' : action.status;
        const metrics = {
            actionId: action.id,
            traceId: action.traceId,
            name: action.name,
            startTime: state.startTime,
            endTime: action.endTime ?? Date.now(),
            durationMs: (action.endTime ?? Date.now()) - state.startTime,
            status,
            metrics: {
                start: state.startSnapshot,
                end: endSnapshot,
                delta,
            },
        };
        this.activeActions.delete(action.id);
        this.completedMetrics.push(metrics);
        return metrics;
    }
    createMetricsFromEndOnly(event, snapshot) {
        const { action } = event;
        const durationMs = action.endTime
            ? action.endTime - action.startTime
            : 0;
        const status = action.status === 'running' ? 'incomplete' : action.status;
        return {
            actionId: action.id,
            traceId: action.traceId,
            name: action.name,
            startTime: action.startTime,
            endTime: action.endTime ?? Date.now(),
            durationMs,
            status,
            metrics: {
                start: snapshot,
                end: snapshot,
                delta: {
                    durationMs: 0,
                    cpuDelta: 0,
                    memoryDeltaMb: 0,
                    heapDeltaMb: 0,
                },
            },
        };
    }
}
//# sourceMappingURL=correlator.js.map