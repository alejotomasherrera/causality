/**
 * @causality/metrics-core — Type Definitions
 *
 * Types for metrics sampling, correlation, and detection.
 */
import type { ActionEvent, ActionSnapshot } from '@causality/sdk-core';
export type { ActionEvent, ActionSnapshot };
/**
 * Snapshot of system resource usage at a point in time.
 */
export interface MetricSnapshot {
    /** Unix timestamp in milliseconds */
    readonly timestamp: number;
    /** CPU usage percentage (0-100) */
    readonly cpuUsage: number;
    /** Resident Set Size in MB */
    readonly memoryRssMb: number;
    /** Heap used in MB */
    readonly heapUsedMb: number;
    /** Event loop lag in ms (optional) */
    readonly eventLoopLagMs?: number;
}
/**
 * Delta between two metric snapshots.
 */
export interface MetricDelta {
    /** Duration between snapshots in ms */
    readonly durationMs: number;
    /** CPU delta (can be negative) */
    readonly cpuDelta: number;
    /** Memory RSS delta in MB */
    readonly memoryDeltaMb: number;
    /** Heap delta in MB */
    readonly heapDeltaMb: number;
    /** Event loop lag change */
    readonly eventLoopLagDeltaMs?: number;
}
/**
 * Complete metrics envelope for an action.
 */
export interface ActionMetrics {
    readonly actionId: string;
    readonly traceId: string;
    readonly name: string;
    readonly startTime: number;
    readonly endTime: number;
    readonly durationMs: number;
    readonly status: 'ok' | 'error' | 'incomplete';
    readonly metrics: {
        readonly start: MetricSnapshot;
        readonly end: MetricSnapshot;
        readonly delta: MetricDelta;
    };
}
/**
 * Finding type for detected issues.
 */
export type FindingType = 'slow_action' | 'high_cpu' | 'memory_spike' | 'event_loop_lag' | 'silent_degradation';
/**
 * Severity levels for findings.
 */
export type FindingSeverity = 'low' | 'medium' | 'high';
/**
 * Structured finding from metric analysis.
 */
export interface MetricFinding {
    readonly type: FindingType;
    readonly severity: FindingSeverity;
    readonly traceId: string;
    readonly actionId: string;
    readonly actionName: string;
    readonly message: string;
    readonly details: Record<string, unknown>;
    readonly metrics: ActionMetrics;
}
/**
 * Thresholds for detection.
 */
export interface DetectionThresholds {
    /** Max action duration before flagging as slow (ms) */
    readonly maxDurationMs?: number;
    /** Max CPU delta percentage before flagging */
    readonly maxCpuDelta?: number;
    /** Max memory delta in MB before flagging */
    readonly maxMemoryDeltaMb?: number;
    /** Max event loop lag in ms before flagging */
    readonly maxEventLoopLagMs?: number;
}
/**
 * Default thresholds.
 */
export declare const DEFAULT_THRESHOLDS: Required<DetectionThresholds>;
/**
 * Collector configuration.
 */
export interface MetricsCollectorConfig {
    /** Detection thresholds */
    readonly thresholds?: DetectionThresholds;
    /** Whether to track event loop lag (slight overhead) */
    readonly trackEventLoopLag?: boolean;
}
/**
 * Internal state for tracking an action's metrics.
 */
export interface ActionMetricState {
    readonly actionId: string;
    readonly traceId: string;
    readonly name: string;
    readonly startTime: number;
    readonly startSnapshot: MetricSnapshot;
}
//# sourceMappingURL=types.d.ts.map