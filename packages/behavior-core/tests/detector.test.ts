/**
 * Tests for Anomaly Detector
 */

import { detectAnomaly, isAnomalous } from '../src/detector.js';
import type { ActionMetrics, ExecutionHistory, SourceContext, HistoricalStats } from '../src/types.js';

function createStats(mean: number, stdDev: number): HistoricalStats {
  return {
    mean,
    stdDev,
    min: mean / 2,
    max: mean * 2,
    p50: mean,
    p95: mean + stdDev * 1.65,
    p99: mean + stdDev * 2.33,
  };
}

function createHistory(
  durationMean: number,
  durationStdDev: number,
  cpuMean: number = 10,
  memoryMean: number = 20
): ExecutionHistory {
  return {
    actionName: 'TestAction',
    sampleCount: 100,
    lastUpdated: Date.now(),
    stats: {
      duration: createStats(durationMean, durationStdDev),
      cpu: createStats(cpuMean, cpuMean * 0.3),
      memory: createStats(memoryMean, memoryMean * 0.25),
    },
  };
}

function createMetrics(
  durationMs: number,
  cpuDelta: number = 10,
  memoryDeltaMb: number = 20
): ActionMetrics {
  return {
    actionId: 'act-1',
    traceId: 'trace-1',
    name: 'TestAction',
    startTime: 1000,
    endTime: 1000 + durationMs,
    durationMs,
    status: 'ok',
    metrics: {
      start: { timestamp: 1000, cpuUsage: 10, memoryRssMb: 100, heapUsedMb: 50 },
      end: { timestamp: 1000 + durationMs, cpuUsage: 10 + cpuDelta, memoryRssMb: 100 + memoryDeltaMb, heapUsedMb: 50 },
      delta: { durationMs, cpuDelta, memoryDeltaMb, heapDeltaMb: memoryDeltaMb / 2 },
    },
  };
}

const source: SourceContext = {
  file: 'src/handlers/test.ts',
  function: 'handleTest',
};

describe('detectAnomaly', () => {
  it('should detect latency spike', () => {
    const history = createHistory(100, 20); // mean 100ms, stdDev 20ms
    const metrics = createMetrics(200); // 5 stdDevs above mean

    const anomaly = detectAnomaly(metrics, history, source, 1);

    expect(anomaly.observedAnomaly).toBe(true);
    expect(anomaly.anomalyType).toBe('latency_spike');
    expect(anomaly.reason).toContain('Latency');
  });

  it('should detect CPU anomaly', () => {
    const history = createHistory(100, 20, 10); // CPU mean 10%
    const metrics = createMetrics(100, 50); // CPU 50%, way above

    const anomaly = detectAnomaly(metrics, history, source, 1);

    expect(anomaly.observedAnomaly).toBe(true);
    expect(anomaly.anomalyType).toBe('cpu_anomaly');
  });

  it('should detect memory anomaly', () => {
    const history = createHistory(100, 20, 10, 20); // Memory mean 20MB
    const metrics = createMetrics(100, 10, 100); // Memory 100MB

    const anomaly = detectAnomaly(metrics, history, source, 1);

    expect(anomaly.observedAnomaly).toBe(true);
    expect(anomaly.anomalyType).toBe('memory_anomaly');
  });

  it('should detect combined anomaly', () => {
    const history = createHistory(100, 20, 10, 20);
    const metrics = createMetrics(200, 50, 100); // All high

    const anomaly = detectAnomaly(metrics, history, source, 1);

    expect(anomaly.observedAnomaly).toBe(true);
    expect(anomaly.anomalyType).toBe('combined_anomaly');
  });

  it('should not detect anomaly for normal values', () => {
    const history = createHistory(100, 20, 10, 20);
    const metrics = createMetrics(110, 12, 25); // Within 1 stdDev

    const anomaly = detectAnomaly(metrics, history, source, 1);

    expect(anomaly.observedAnomaly).toBe(false);
    expect(anomaly.anomalyType).toBeUndefined();
    expect(anomaly.reason).toContain('No anomaly');
  });

  it('should include file and function from source', () => {
    const history = createHistory(100, 20);
    const metrics = createMetrics(200);

    const anomaly = detectAnomaly(metrics, history, source, 1);

    expect(anomaly.file).toBe('src/handlers/test.ts');
    expect(anomaly.function).toBe('handleTest');
  });

  it('should calculate confidence score', () => {
    const history = createHistory(100, 20);
    const metrics = createMetrics(200);

    const anomaly = detectAnomaly(metrics, history, source, 1);

    expect(anomaly.confidence).toBeGreaterThan(0);
    expect(anomaly.confidence).toBeLessThanOrEqual(1);
  });

  it('should use custom thresholds', () => {
    const history = createHistory(100, 20);
    const metrics = createMetrics(150); // 2.5 stdDevs

    // With threshold 3, shouldn't be anomaly
    const anomaly1 = detectAnomaly(metrics, history, source, 1, { stdDevThreshold: 3 });
    expect(anomaly1.observedAnomaly).toBe(false);

    // With threshold 2, should be anomaly
    const anomaly2 = detectAnomaly(metrics, history, source, 1, { stdDevThreshold: 2 });
    expect(anomaly2.observedAnomaly).toBe(true);
  });

  it('should be deterministic', () => {
    const history = createHistory(100, 20);
    const metrics = createMetrics(200);

    const anomaly1 = detectAnomaly(metrics, history, source, 5);
    const anomaly2 = detectAnomaly(metrics, history, source, 5);

    expect(anomaly1.observedAnomaly).toBe(anomaly2.observedAnomaly);
    expect(anomaly1.confidence).toBe(anomaly2.confidence);
    expect(anomaly1.repeatSensitivity).toBe(anomaly2.repeatSensitivity);
    expect(anomaly1.reason).toBe(anomaly2.reason);
  });
});

describe('isAnomalous', () => {
  it('should return true for anomalous metrics', () => {
    const history = createHistory(100, 20);
    const metrics = createMetrics(200);

    expect(isAnomalous(metrics, history)).toBe(true);
  });

  it('should return false for normal metrics', () => {
    const history = createHistory(100, 20);
    const metrics = createMetrics(110);

    expect(isAnomalous(metrics, history)).toBe(false);
  });
});
