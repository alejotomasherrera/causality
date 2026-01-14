/**
 * @causality/metrics-core — Detectors
 *
 * Threshold-based detection of performance issues.
 * Deterministic, no AI, no heuristics.
 */
import type { ActionMetrics, MetricFinding, DetectionThresholds } from './types.js';
/**
 * Detect slow action based on duration threshold.
 */
export declare function detectSlowAction(metrics: ActionMetrics, thresholds: DetectionThresholds): MetricFinding | null;
/**
 * Detect high CPU usage spike during action.
 */
export declare function detectHighCpu(metrics: ActionMetrics, thresholds: DetectionThresholds): MetricFinding | null;
/**
 * Detect memory spike during action.
 */
export declare function detectMemorySpike(metrics: ActionMetrics, thresholds: DetectionThresholds): MetricFinding | null;
/**
 * Detect event loop lag.
 */
export declare function detectEventLoopLag(metrics: ActionMetrics, thresholds: DetectionThresholds): MetricFinding | null;
/**
 * Detect silent degradation: action succeeded but had poor performance.
 * This is the key finding type for Phase 3B.
 */
export declare function detectSilentDegradation(metrics: ActionMetrics, thresholds: DetectionThresholds): MetricFinding | null;
/**
 * Run all detectors on an action.
 */
export declare function runAllDetectors(metrics: ActionMetrics, thresholds: DetectionThresholds): MetricFinding[];
//# sourceMappingURL=detectors.d.ts.map