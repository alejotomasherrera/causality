/**
 * @causality/metrics-core — Correlator
 *
 * Correlates ActionEvents with MetricSnapshots to produce ActionMetrics.
 */
import type { ActionEvent, ActionMetrics } from './types.js';
import { ResourceSampler } from './sampler.js';
/**
 * Correlates actions with metrics.
 * Tracks active actions and captures resource snapshots at start/end.
 */
export declare class MetricsCorrelator {
    private readonly sampler;
    private readonly activeActions;
    private readonly completedMetrics;
    constructor(sampler?: ResourceSampler);
    /**
     * Process an action event.
     * On action.start: capture start snapshot
     * On action.end: capture end snapshot, compute delta, produce ActionMetrics
     */
    ingest(event: ActionEvent): ActionMetrics | null;
    /**
     * Get all completed action metrics.
     */
    getCompletedMetrics(): ActionMetrics[];
    /**
     * Get metrics for a specific action.
     */
    getMetrics(actionId: string): ActionMetrics | undefined;
    /**
     * Get metrics for a specific trace.
     */
    getMetricsByTrace(traceId: string): ActionMetrics[];
    /**
     * Clear collected metrics.
     */
    clear(): void;
    /**
     * Get count of active (unfinished) actions.
     */
    activeCount(): number;
    /**
     * Get count of completed metrics.
     */
    completedCount(): number;
    private handleStart;
    private handleEnd;
    private createMetricsFromEndOnly;
}
//# sourceMappingURL=correlator.d.ts.map