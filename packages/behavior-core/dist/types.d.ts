/**
 * @causality/behavior-core — Type Definitions
 *
 * Types for behavioral consistency analysis and anomaly detection.
 */
import type { ActionMetrics, MetricFinding } from '@causality/metrics-core';
export type { ActionMetrics, MetricFinding };
/**
 * Resource consumption level classification.
 */
export type ConsumptionLevel = 'low' | 'medium' | 'high';
/**
 * Repeat sensitivity classification.
 */
export type RepeatSensitivity = 'singleOccurrence' | 'flag';
/**
 * Anomaly type classification.
 */
export type AnomalyType = 'latency_spike' | 'cpu_anomaly' | 'memory_anomaly' | 'event_loop_anomaly' | 'combined_anomaly';
/**
 * Observed metrics for an action.
 */
export interface MetricsObserved {
    readonly durationMs: number;
    readonly cpuDelta: number;
    readonly memoryDeltaMb: number;
    readonly eventLoopLagMs?: number;
}
/**
 * Expected metrics baseline.
 */
export interface MetricsExpected {
    readonly cpu: ConsumptionLevel;
    readonly memory: ConsumptionLevel;
    readonly durationMs: number;
    /** Statistical thresholds */
    readonly thresholds: {
        readonly durationP95: number;
        readonly durationP99: number;
        readonly cpuP95: number;
        readonly memoryP95: number;
    };
}
/**
 * Source code context for an action.
 */
export interface SourceContext {
    readonly file: string;
    readonly function: string;
    readonly lines?: {
        start: number;
        end: number;
    };
}
/**
 * Action execution context.
 */
export interface ActionContext {
    readonly actionName: string;
    readonly traceId: string;
    readonly parentId?: string;
    readonly attributes?: Record<string, unknown>;
    /** Optional microservice identifier */
    readonly service?: string;
    /** Optional user identifier */
    readonly userId?: string;
}
/**
 * Historical execution data for an action.
 */
export interface ExecutionHistory {
    readonly actionName: string;
    readonly sampleCount: number;
    readonly lastUpdated: number;
    readonly stats: {
        readonly duration: HistoricalStats;
        readonly cpu: HistoricalStats;
        readonly memory: HistoricalStats;
    };
}
/**
 * Statistical summary for a metric.
 */
export interface HistoricalStats {
    readonly mean: number;
    readonly stdDev: number;
    readonly min: number;
    readonly max: number;
    readonly p50: number;
    readonly p95: number;
    readonly p99: number;
}
/**
 * Behavior anomaly detected.
 */
export interface BehaviorAnomaly {
    /** Action name */
    readonly actionName: string;
    /** Source code context */
    readonly file: string;
    readonly function: string;
    /** Observed metrics */
    readonly metricsObserved: MetricsObserved;
    /** Expected metrics baseline */
    readonly metricsExpected: MetricsExpected;
    /** Whether an anomaly was detected */
    readonly observedAnomaly: boolean;
    /** Confidence score 0-1 */
    readonly confidence: number;
    /** Repeat sensitivity classification */
    readonly repeatSensitivity: RepeatSensitivity;
    /** Human-readable reason for the deviation */
    readonly reason: string;
    /** Anomaly type */
    readonly anomalyType?: AnomalyType;
    /** Deviation magnitude (how many stdDevs from mean) */
    readonly deviationMagnitude?: number;
}
/**
 * Full analysis result for Impact Core integration.
 */
export interface BehaviorAnalysisResult {
    /** Unique analysis ID */
    readonly id: string;
    /** Trace ID being analyzed */
    readonly traceId: string;
    /** When analysis was performed */
    readonly analyzedAt: number;
    /** Action context */
    readonly context: ActionContext;
    /** Source context */
    readonly source: SourceContext;
    /** Detected anomaly (if any) */
    readonly anomaly: BehaviorAnomaly;
    /** Occurrence count in history */
    readonly occurrenceCount: number;
    /** Whether this should be flagged for review */
    readonly shouldFlag: boolean;
    /** Related findings from metrics-core */
    readonly relatedFindings: MetricFinding[];
}
/**
 * Configuration for behavior analysis.
 */
export interface BehaviorAnalysisConfig {
    /** Minimum samples required for reliable baseline */
    readonly minSamplesForBaseline?: number;
    /** Standard deviation threshold for anomaly detection */
    readonly stdDevThreshold?: number;
    /** Minimum occurrences before flagging */
    readonly minOccurrencesToFlag?: number;
    /** Confidence threshold for flagging */
    readonly confidenceThreshold?: number;
}
/**
 * Default configuration values.
 */
export declare const DEFAULT_BEHAVIOR_CONFIG: Required<BehaviorAnalysisConfig>;
/**
 * Input for analysis.
 */
export interface AnalysisInput {
    /** Action context */
    readonly context: ActionContext;
    /** Current metrics */
    readonly metrics: ActionMetrics;
    /** Historical execution data */
    readonly history: ExecutionHistory;
    /** Source code context */
    readonly source: SourceContext;
    /** Related findings (optional) */
    readonly findings?: MetricFinding[];
}
//# sourceMappingURL=types.d.ts.map