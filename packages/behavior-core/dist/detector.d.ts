/**
 * @causality/behavior-core — Anomaly Detector
 *
 * Compare observed metrics against historical baseline.
 * Deterministic detection based on statistical thresholds.
 */
import type { ActionMetrics, ExecutionHistory, BehaviorAnomaly, BehaviorAnalysisConfig, SourceContext } from './types.js';
/**
 * Detect anomalies by comparing current metrics to history.
 */
export declare function detectAnomaly(metrics: ActionMetrics, history: ExecutionHistory, source: SourceContext, occurrenceCount: number, config?: BehaviorAnalysisConfig): BehaviorAnomaly;
/**
 * Quick check if metrics are anomalous without full analysis.
 */
export declare function isAnomalous(metrics: ActionMetrics, history: ExecutionHistory, stdDevThreshold?: number): boolean;
//# sourceMappingURL=detector.d.ts.map