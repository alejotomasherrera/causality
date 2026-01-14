/**
 * @causality/behavior-core — Baseline Calculator
 *
 * Calculate expected metrics baseline from historical data.
 * Deterministic classification based on historical distribution.
 */

import type {
  ExecutionHistory,
  MetricsExpected,
  ConsumptionLevel,
  HistoricalStats,
} from './types.js';

/**
 * Calculate expected metrics baseline from history.
 */
export function calculateBaseline(history: ExecutionHistory): MetricsExpected {
  const { stats } = history;

  return {
    cpu: classifyConsumption(stats.cpu),
    memory: classifyConsumption(stats.memory),
    durationMs: stats.duration.p95,
    thresholds: {
      durationP95: stats.duration.p95,
      durationP99: stats.duration.p99,
      cpuP95: stats.cpu.p95,
      memoryP95: stats.memory.p95,
    },
  };
}

/**
 * Classify consumption level based on historical distribution.
 */
export function classifyConsumption(stats: HistoricalStats): ConsumptionLevel {
  // Classification based on absolute thresholds + distribution
  // These thresholds are for typical Node.js applications
  
  // CPU: percentage delta
  if ('mean' in stats) {
    const value = stats.mean;
    
    // For memory (in MB)
    if (stats.max > 100) {
      // Likely memory stats
      if (value < 10) return 'low';
      if (value < 50) return 'medium';
      return 'high';
    }
    
    // For CPU (percentage)
    if (stats.max < 100) {
      if (value < 5) return 'low';
      if (value < 20) return 'medium';
      return 'high';
    }
  }
  
  return 'medium';
}

/**
 * Calculate deviation from baseline.
 * Returns number of standard deviations from mean.
 */
export function calculateDeviation(
  observed: number,
  stats: HistoricalStats
): number {
  if (stats.stdDev === 0) {
    // No variance, any deviation is significant
    return observed === stats.mean ? 0 : Infinity;
  }
  
  return (observed - stats.mean) / stats.stdDev;
}

/**
 * Check if a value exceeds the baseline threshold.
 */
export function exceedsBaseline(
  observed: number,
  stats: HistoricalStats,
  stdDevThreshold: number
): boolean {
  const deviation = calculateDeviation(observed, stats);
  return deviation > stdDevThreshold;
}

/**
 * Calculate confidence score based on sample size and deviation.
 * Higher sample count + clearer deviation = higher confidence.
 */
export function calculateConfidence(
  sampleCount: number,
  deviation: number,
  minSamples: number
): number {
  // Sample count factor: 0 at minSamples, approaches 1 asymptotically
  const sampleFactor = Math.min(1, (sampleCount - minSamples) / (minSamples * 2));
  
  // Deviation factor: stronger deviation = higher confidence
  const deviationFactor = Math.min(1, Math.abs(deviation) / 5);
  
  // Combine factors
  const confidence = 0.5 + (sampleFactor * 0.25) + (deviationFactor * 0.25);
  
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Get human-readable description of baseline.
 */
export function describeBaseline(expected: MetricsExpected): string {
  return `Expected: ${expected.cpu} CPU, ${expected.memory} memory, ~${Math.round(expected.durationMs)}ms latency`;
}

/**
 * Compare two baselines.
 */
export function compareBaselines(
  a: MetricsExpected,
  b: MetricsExpected
): { changed: boolean; changes: string[] } {
  const changes: string[] = [];
  
  if (a.cpu !== b.cpu) {
    changes.push(`CPU: ${a.cpu} → ${b.cpu}`);
  }
  if (a.memory !== b.memory) {
    changes.push(`Memory: ${a.memory} → ${b.memory}`);
  }
  
  const durationChange = Math.abs(a.durationMs - b.durationMs) / a.durationMs;
  if (durationChange > 0.2) { // 20% threshold
    changes.push(`Duration: ${Math.round(a.durationMs)}ms → ${Math.round(b.durationMs)}ms`);
  }
  
  return {
    changed: changes.length > 0,
    changes,
  };
}
