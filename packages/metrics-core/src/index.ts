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
import type {
  MetricsCollectorConfig,
  ActionMetrics,
  MetricFinding,
  DetectionThresholds,
  DEFAULT_THRESHOLDS,
} from './types.js';
import { ResourceSampler } from './sampler.js';
import { MetricsCorrelator } from './correlator.js';
import { runAllDetectors } from './detectors.js';
import { InMemoryReporter } from './reporters.js';

/**
 * Main entry point for metrics collection and analysis.
 */
export class MetricsCollector {
  private readonly sampler: ResourceSampler;
  private readonly correlator: MetricsCorrelator;
  private readonly reporter: InMemoryReporter;
  private readonly thresholds: DetectionThresholds;

  constructor(config?: MetricsCollectorConfig) {
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
  ingest(event: ActionEvent): void {
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
  getFindings(): MetricFinding[] {
    return this.reporter.getFindings();
  }

  /**
   * Get silent degradation findings only.
   */
  getSilentDegradations(): MetricFinding[] {
    return this.reporter.getSilentDegradations();
  }

  /**
   * Get findings by type.
   */
  getFindingsByType(type: string): MetricFinding[] {
    return this.reporter.getFindingsByType(type);
  }

  /**
   * Get all completed action metrics.
   */
  getMetrics(): ActionMetrics[] {
    return this.correlator.getCompletedMetrics();
  }

  /**
   * Get metrics for a specific trace.
   */
  getMetricsByTrace(traceId: string): ActionMetrics[] {
    return this.correlator.getMetricsByTrace(traceId);
  }

  /**
   * Analyze all collected metrics and return findings.
   * Re-runs detection on all metrics.
   */
  analyze(): MetricFinding[] {
    const allMetrics = this.correlator.getCompletedMetrics();
    const findings: MetricFinding[] = [];

    for (const metrics of allMetrics) {
      const actionFindings = runAllDetectors(metrics, this.thresholds);
      findings.push(...actionFindings);
    }

    return findings;
  }

  /**
   * Clear all collected data.
   */
  clear(): void {
    this.correlator.clear();
    this.reporter.clear();
    this.sampler.reset();
  }

  /**
   * Destroy collector and release resources.
   */
  destroy(): void {
    this.sampler.destroy();
  }

  /**
   * Get collector statistics.
   */
  stats(): {
    activeActions: number;
    completedMetrics: number;
    findings: number;
  } {
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
export {
  detectSlowAction,
  detectHighCpu,
  detectMemorySpike,
  detectEventLoopLag,
  detectSilentDegradation,
  runAllDetectors,
} from './detectors.js';
export {
  ConsoleReporter,
  InMemoryReporter,
  generateReport,
  formatFinding,
  formatReportText,
  formatReportJson,
  groupByTrace,
  groupByAction,
  filterBySeverity,
  sortBySeverity,
} from './reporters.js';

// Re-export types
export type {
  MetricSnapshot,
  MetricDelta,
  ActionMetrics,
  MetricFinding,
  FindingType,
  FindingSeverity,
  DetectionThresholds,
  MetricsCollectorConfig,
  ActionEvent,
  ActionSnapshot,
} from './types.js';

export { DEFAULT_THRESHOLDS } from './types.js';
