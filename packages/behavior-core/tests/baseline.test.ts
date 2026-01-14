/**
 * Tests for Baseline Calculator
 */

import {
  calculateBaseline,
  classifyConsumption,
  calculateDeviation,
  exceedsBaseline,
  calculateConfidence,
} from '../src/baseline.js';
import type { ExecutionHistory, HistoricalStats } from '../src/types.js';

function createStats(mean: number, stdDev: number, max: number = mean * 2): HistoricalStats {
  return {
    mean,
    stdDev,
    min: mean / 2,
    max,
    p50: mean,
    p95: mean + stdDev * 1.65,
    p99: mean + stdDev * 2.33,
  };
}

function createHistory(
  durationMean: number = 100,
  cpuMean: number = 10,
  memoryMean: number = 20
): ExecutionHistory {
  return {
    actionName: 'TestAction',
    sampleCount: 100,
    lastUpdated: Date.now(),
    stats: {
      duration: createStats(durationMean, durationMean * 0.2),
      cpu: createStats(cpuMean, cpuMean * 0.3),
      memory: createStats(memoryMean, memoryMean * 0.25),
    },
  };
}

describe('calculateBaseline', () => {
  it('should calculate expected metrics from history', () => {
    const history = createHistory(100, 10, 20);
    const baseline = calculateBaseline(history);

    expect(baseline.durationMs).toBeCloseTo(133, 0); // p95
    expect(baseline.cpu).toBeDefined();
    expect(baseline.memory).toBeDefined();
    expect(baseline.thresholds).toBeDefined();
  });

  it('should include threshold values', () => {
    const history = createHistory(100, 10, 20);
    const baseline = calculateBaseline(history);

    expect(baseline.thresholds.durationP95).toBeGreaterThan(0);
    expect(baseline.thresholds.cpuP95).toBeGreaterThan(0);
    expect(baseline.thresholds.memoryP95).toBeGreaterThan(0);
  });
});

describe('classifyConsumption', () => {
  it('should classify low CPU', () => {
    const stats = createStats(2, 1, 50);
    expect(classifyConsumption(stats)).toBe('low');
  });

  it('should classify medium CPU', () => {
    const stats = createStats(10, 3, 50);
    expect(classifyConsumption(stats)).toBe('medium');
  });

  it('should classify high CPU', () => {
    const stats = createStats(30, 10, 50);
    expect(classifyConsumption(stats)).toBe('high');
  });

  it('should classify low memory', () => {
    const stats = createStats(5, 2, 200);
    expect(classifyConsumption(stats)).toBe('low');
  });

  it('should classify high memory', () => {
    const stats = createStats(100, 30, 200);
    expect(classifyConsumption(stats)).toBe('high');
  });
});

describe('calculateDeviation', () => {
  it('should return 0 for value at mean', () => {
    const stats = createStats(100, 20);
    expect(calculateDeviation(100, stats)).toBe(0);
  });

  it('should return positive deviation above mean', () => {
    const stats = createStats(100, 20);
    expect(calculateDeviation(140, stats)).toBe(2); // 2 stdDevs
  });

  it('should return negative deviation below mean', () => {
    const stats = createStats(100, 20);
    expect(calculateDeviation(60, stats)).toBe(-2);
  });

  it('should handle zero stdDev', () => {
    const stats = createStats(100, 0);
    expect(calculateDeviation(100, stats)).toBe(0);
    expect(calculateDeviation(101, stats)).toBe(Infinity);
  });
});

describe('exceedsBaseline', () => {
  it('should return false within threshold', () => {
    const stats = createStats(100, 20);
    expect(exceedsBaseline(130, stats, 2)).toBe(false);
  });

  it('should return true above threshold', () => {
    const stats = createStats(100, 20);
    expect(exceedsBaseline(150, stats, 2)).toBe(true);
  });
});

describe('calculateConfidence', () => {
  it('should return higher confidence with more samples', () => {
    const conf10 = calculateConfidence(10, 3, 10);
    const conf100 = calculateConfidence(100, 3, 10);

    expect(conf100).toBeGreaterThan(conf10);
  });

  it('should return higher confidence with stronger deviation', () => {
    const confLow = calculateConfidence(50, 1, 10);
    const confHigh = calculateConfidence(50, 4, 10);

    expect(confHigh).toBeGreaterThan(confLow);
  });

  it('should be bounded between 0 and 1', () => {
    expect(calculateConfidence(1000, 10, 10)).toBeLessThanOrEqual(1);
    expect(calculateConfidence(5, 0.1, 10)).toBeGreaterThanOrEqual(0);
  });
});
