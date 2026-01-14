/**
 * @causality/metrics-core
 *
 * Metrics correlation for causal actions.
 * Detects performance degradation without explicit errors.
 *
 * @example
 * import { onActionEvent } from '@causality/sdk-core';
 * import { MetricsCollector } from '@causality/metrics-core';
 *
 * const metrics = new MetricsCollector();
 * onActionEvent(event => metrics.ingest(event));
 *
 * // Later...
 * const findings = metrics.analyze();
 *
 * @packageDocumentation
 */
import type { ActionEvent } from '@causality/sdk-core';
import type { MetricsCollectorConfig, ActionMetrics, MetricFinding } from './types.js';
/**
 * Main entry point for metrics collection and analysis.
 */
export declare class MetricsCollector {
    private readonly sampler;
    private readonly correlator;
    private readonly reporter;
    private readonly thresholds;
    constructor(config?: MetricsCollectorConfig);
    /**
     * Ingest an action event for metrics collection.
     */
    ingest(event: ActionEvent): void;
    /**
     * Get all findings detected so far.
     */
    getFindings(): MetricFinding[];
    /**
     * Get silent degradation findings only.
     */
    getSilentDegradations(): MetricFinding[];
    /**
     * Get findings by type.
     */
    getFindingsByType(type: string): MetricFinding[];
    /**
     * Get all completed action metrics.
     */
    getMetrics(): ActionMetrics[];
    /**
     * Get metrics for a specific trace.
     */
    getMetricsByTrace(traceId: string): ActionMetrics[];
    /**
     * Analyze all collected metrics and return findings.
     * Re-runs detection on all metrics.
     */
    analyze(): MetricFinding[];
    /**
     * Clear all collected data.
     */
    clear(): void;
    /**
     * Destroy collector and release resources.
     */
    destroy(): void;
    /**
     * Get collector statistics.
     */
    stats(): {
        activeActions: number;
        completedMetrics: number;
        findings: number;
    };
}
export { ResourceSampler, createSnapshot, calculateDelta } from './sampler.js';
export { MetricsCorrelator } from './correlator.js';
export { detectSlowAction, detectHighCpu, detectMemorySpike, detectEventLoopLag, detectSilentDegradation, runAllDetectors, } from './detectors.js';
export { ConsoleReporter, InMemoryReporter, generateReport, formatFinding, formatReportText, formatReportJson, groupByTrace, groupByAction, filterBySeverity, sortBySeverity, } from './reporters.js';
export type { MetricSnapshot, MetricDelta, ActionMetrics, MetricFinding, FindingType, FindingSeverity, DetectionThresholds, MetricsCollectorConfig, ActionEvent, ActionSnapshot, } from './types.js';
export { DEFAULT_THRESHOLDS } from './types.js';
//# sourceMappingURL=index.d.ts.map