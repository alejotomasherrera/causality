/**
 * @causality/behavior-core — Baseline Calculator
 *
 * Calculate expected metrics baseline from historical data.
 * Deterministic classification based on historical distribution.
 */
import type { ExecutionHistory, MetricsExpected, ConsumptionLevel, HistoricalStats } from './types.js';
/**
 * Calculate expected metrics baseline from history.
 */
export declare function calculateBaseline(history: ExecutionHistory): MetricsExpected;
/**
 * Classify consumption level based on historical distribution.
 */
export declare function classifyConsumption(stats: HistoricalStats): ConsumptionLevel;
/**
 * Calculate deviation from baseline.
 * Returns number of standard deviations from mean.
 */
export declare function calculateDeviation(observed: number, stats: HistoricalStats): number;
/**
 * Check if a value exceeds the baseline threshold.
 */
export declare function exceedsBaseline(observed: number, stats: HistoricalStats, stdDevThreshold: number): boolean;
/**
 * Calculate confidence score based on sample size and deviation.
 * Higher sample count + clearer deviation = higher confidence.
 */
export declare function calculateConfidence(sampleCount: number, deviation: number, minSamples: number): number;
/**
 * Get human-readable description of baseline.
 */
export declare function describeBaseline(expected: MetricsExpected): string;
/**
 * Compare two baselines.
 */
export declare function compareBaselines(a: MetricsExpected, b: MetricsExpected): {
    changed: boolean;
    changes: string[];
};
//# sourceMappingURL=baseline.d.ts.map