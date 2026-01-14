/**
 * @causality/behavior-core
 *
 * Behavioral consistency analysis for causal actions.
 * Detect anomalies from historical patterns without AI-driven alerts.
 *
 * @example
 * import { createBehaviorAnalyzer } from '@causality/behavior-core';
 *
 * const analyzer = createBehaviorAnalyzer();
 *
 * // Record executions to build history
 * analyzer.recordExecution(metrics);
 *
 * // Analyze for anomalies
 * const result = analyzer.analyzeWithStoredHistory(context, metrics, source);
 *
 * if (result?.shouldFlag) {
 *   console.log(result.anomaly.reason);
 * }
 *
 * @packageDocumentation
 */
export { BehaviorAnalyzer, analyzeBehavior, createBehaviorAnalyzer, toImpactJson, } from './analyzer.js';
export { ExecutionHistoryStore, createHistoryStore, } from './history.js';
export { calculateBaseline, classifyConsumption, calculateDeviation, exceedsBaseline, calculateConfidence, describeBaseline, compareBaselines, } from './baseline.js';
export { detectAnomaly, isAnomalous, } from './detector.js';
export { classifySensitivity, shouldFlagForReview, describeSensitivity, OccurrenceTracker, createOccurrenceTracker, } from './sensitivity.js';
export type { ConsumptionLevel, RepeatSensitivity, AnomalyType, MetricsObserved, MetricsExpected, SourceContext, ActionContext, ExecutionHistory, HistoricalStats, BehaviorAnomaly, BehaviorAnalysisResult, BehaviorAnalysisConfig, AnalysisInput, ActionMetrics, MetricFinding, } from './types.js';
export { DEFAULT_BEHAVIOR_CONFIG } from './types.js';
//# sourceMappingURL=index.d.ts.map