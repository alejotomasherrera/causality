/**
 * @causality/historical-core — Type Definitions
 *
 * Types for historical data aggregation and trend analysis.
 */

import type { EnrichedExplanation } from '@causality/code-tracing-core';

// Re-export for convenience
export type { EnrichedExplanation };

/**
 * Historical record for a single trace execution.
 */
export interface HistoricalRecord {
  readonly traceId: string;
  readonly timestamp: number;
  readonly status: 'ok' | 'error' | 'degraded';
  readonly metrics: {
    readonly durationMs: number;
    readonly cpuDelta: number;
    readonly memoryDeltaMb: number;
  };
  readonly errorType?: string;
  readonly anomalies: string[]; // List of anomaly types/reasons
  readonly impactScore: number;
}

/**
 * Aggregation key components.
 */
export interface AggregationKey {
  readonly service: string;
  readonly functionName: string; // "function" is reserved keyword
  readonly actionName: string;
}

/**
 * Aggregated statistics for a specific function/action.
 */
export interface AggregatedStats {
  readonly key: AggregationKey;
  
  // Counts
  readonly totalExecutions: number;
  readonly totalFailures: number;
  readonly totalDegradations: number;
  
  // Time range
  readonly firstSeen: number;
  readonly lastSeen: number;
  
  // Metrics stats (running stats could be used, but simple aggregates for now)
  readonly avgDurationMs: number;
  readonly maxDurationMs: number;
  readonly avgCpuDelta: number;
  readonly maxCpuDelta: number;
  readonly avgMemoryDeltaMb: number;
  readonly maxMemoryDeltaMb: number;
  
  // Errors
  readonly errorCounts: Record<string, number>;
  
  // History of recent records (limited window)
  readonly recentHistory: HistoricalRecord[];
}

/**
 * Trend direction.
 */
export type TrendDirection = 'improving' | 'stable' | 'degrading' | 'unknown';

/**
 * Trend analysis result.
 */
export interface TrendAnalysis {
  readonly durationTrend: TrendDirection;
  readonly errorTrend: TrendDirection;
  readonly stabilityScore: number; // 0-100, higher is better
  readonly frequentAnomalies: string[];
  readonly isSilentDegradation: boolean;
}

/**
 * Recommendation for attention.
 */
export type AttentionLevel = 'developer' | 'product' | 'ops' | 'none';

/**
 * Final reported item for a microservice/function.
 */
export interface HistoricalReportItem {
  readonly microservice: string;
  readonly function: string;
  readonly actionName: string;
  
  readonly totalFailures: number;
  readonly totalSilentDegradations: number;
  
  readonly averageDuration: number;
  readonly maxCpuDelta: number;
  readonly maxMemoryDelta: number;
  
  readonly mostCommonError: string;
  
  readonly trend: TrendDirection;
  readonly recommendedAttention: AttentionLevel;
  
  readonly historicalTraces: string[]; // List of trace IDs
}

/**
 * Complete historical report.
 */
export interface HistoricalReport {
  readonly generatedAt: number;
  readonly items: HistoricalReportItem[];
  readonly summary: {
    readonly totalServices: number;
    readonly totalFunctions: number;
    readonly criticalItems: number;
  };
}

/**
 * Configuration for historical analysis.
 */
export interface HistoricalConfig {
  /** Max history records to keep per item */
  readonly maxHistorySize?: number;
  /** Minimum executions to calculate trend */
  readonly minExecutionsForTrend?: number;
  /** Importance weight for recent events (0-1) */
  readonly recencyWeight?: number;
}
