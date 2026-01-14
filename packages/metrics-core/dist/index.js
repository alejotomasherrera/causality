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
import { ResourceSampler } from './sampler.js';
import { MetricsCorrelator } from './correlator.js';
import { runAllDetectors } from './detectors.js';
import { InMemoryReporter } from './reporters.js';
/**
 * Main entry point for metrics collection and analysis.
 */
export class MetricsCollector {
    sampler;
    correlator;
    reporter;
    thresholds;
    constructor(config) {
        this.sampler = new ResourceSampler({
            trackEventLoopLag: config?.trackEventLoopLag ?? false,
        });
        this.correlator = new MetricsCorrelator(this.sampler);
        this.reporter = new InMemoryReporter();
        this.thresholds = config?.thresholds ?? {};
    }
    /**
     * Ingest an action event for metrics collection.
     */
    ingest(event) {
        const metrics = this.correlator.ingest(event);
        if (metrics) {
            // Run detection on completed actions
            const findings = runAllDetectors(metrics, this.thresholds);
            if (findings.length > 0) {
                this.reporter.report(findings);
            }
        }
    }
    /**
     * Get all findings detected so far.
     */
    getFindings() {
        return this.reporter.getFindings();
    }
    /**
     * Get silent degradation findings only.
     */
    getSilentDegradations() {
        return this.reporter.getSilentDegradations();
    }
    /**
     * Get findings by type.
     */
    getFindingsByType(type) {
        return this.reporter.getFindingsByType(type);
    }
    /**
     * Get all completed action metrics.
     */
    getMetrics() {
        return this.correlator.getCompletedMetrics();
    }
    /**
     * Get metrics for a specific trace.
     */
    getMetricsByTrace(traceId) {
        return this.correlator.getMetricsByTrace(traceId);
    }
    /**
     * Analyze all collected metrics and return findings.
     * Re-runs detection on all metrics.
     */
    analyze() {
        const allMetrics = this.correlator.getCompletedMetrics();
        const findings = [];
        for (const metrics of allMetrics) {
            const actionFindings = runAllDetectors(metrics, this.thresholds);
            findings.push(...actionFindings);
        }
        return findings;
    }
    /**
     * Clear all collected data.
     */
    clear() {
        this.correlator.clear();
        this.reporter.clear();
        this.sampler.reset();
    }
    /**
     * Destroy collector and release resources.
     */
    destroy() {
        this.sampler.destroy();
    }
    /**
     * Get collector statistics.
     */
    stats() {
        return {
            activeActions: this.correlator.activeCount(),
            completedMetrics: this.correlator.completedCount(),
            findings: this.reporter.count(),
        };
    }
}
// Re-export components
export { ResourceSampler, createSnapshot, calculateDelta } from './sampler.js';
export { MetricsCorrelator } from './correlator.js';
export { detectSlowAction, detectHighCpu, detectMemorySpike, detectEventLoopLag, detectSilentDegradation, runAllDetectors, } from './detectors.js';
export { ConsoleReporter, InMemoryReporter, generateReport, formatFinding, formatReportText, formatReportJson, groupByTrace, groupByAction, filterBySeverity, sortBySeverity, } from './reporters.js';
export { DEFAULT_THRESHOLDS } from './types.js';
//# sourceMappingURL=index.js.map