/**
 * Tests for Detectors
 */

import {
  detectSlowAction,
  detectHighCpu,
  detectMemorySpike,
  detectEventLoopLag,
  detectSilentDegradation,
  runAllDetectors,
} from '../src/detectors.js';
import type { ActionMetrics, DetectionThresholds } from '../src/types.js';

function createMetrics(
  overrides: Partial<{
    durationMs: number;
    cpuDelta: number;
    memoryDeltaMb: number;
    eventLoopLagMs: number;
    status: 'ok' | 'error' | 'incomplete';
  }> = {}
): ActionMetrics {
  const durationMs = overrides.durationMs ?? 100;
  const startTime = Date.now() - durationMs;

  return {
    actionId: 'test-action',
    traceId: 'test-trace',
    name: 'TestAction',
    startTime,
    endTime: startTime + durationMs,
    durationMs,
    status: overrides.status ?? 'ok',
    metrics: {
      start: {
        timestamp: startTime,
        cpuUsage: 10,
        memoryRssMb: 100,
        heapUsedMb: 50,
        eventLoopLagMs: 5,
      },
      end: {
        timestamp: startTime + durationMs,
        cpuUsage: 10 + (overrides.cpuDelta ?? 0),
        memoryRssMb: 100 + (overrides.memoryDeltaMb ?? 0),
        heapUsedMb: 50,
        eventLoopLagMs: overrides.eventLoopLagMs ?? 5,
      },
      delta: {
        durationMs,
        cpuDelta: overrides.cpuDelta ?? 0,
        memoryDeltaMb: overrides.memoryDeltaMb ?? 0,
        heapDeltaMb: 0,
        eventLoopLagDeltaMs: (overrides.eventLoopLagMs ?? 5) - 5,
      },
    },
  };
}

const defaultThresholds: DetectionThresholds = {
  maxDurationMs: 500,
  maxCpuDelta: 20,
  maxMemoryDeltaMb: 50,
  maxEventLoopLagMs: 100,
};

describe('detectSlowAction', () => {
  it('should detect slow action', () => {
    const metrics = createMetrics({ durationMs: 1000 });
    const finding = detectSlowAction(metrics, defaultThresholds);

    expect(finding).not.toBeNull();
    expect(finding?.type).toBe('slow_action');
    expect(finding?.message).toContain('1000ms');
  });

  it('should not detect fast action', () => {
    const metrics = createMetrics({ durationMs: 100 });
    const finding = detectSlowAction(metrics, defaultThresholds);

    expect(finding).toBeNull();
  });

  it('should calculate severity based on ratio', () => {
    // > 3x threshold = high
    const highMetrics = createMetrics({ durationMs: 2000 });
    const highFinding = detectSlowAction(highMetrics, defaultThresholds);
    expect(highFinding?.severity).toBe('high');

    // > 2x threshold = medium
    const mediumMetrics = createMetrics({ durationMs: 1100 });
    const mediumFinding = detectSlowAction(mediumMetrics, defaultThresholds);
    expect(mediumFinding?.severity).toBe('medium');

    // <= 2x threshold = low
    const lowMetrics = createMetrics({ durationMs: 600 });
    const lowFinding = detectSlowAction(lowMetrics, defaultThresholds);
    expect(lowFinding?.severity).toBe('low');
  });
});

describe('detectHighCpu', () => {
  it('should detect high CPU spike', () => {
    const metrics = createMetrics({ cpuDelta: 50 });
    const finding = detectHighCpu(metrics, defaultThresholds);

    expect(finding).not.toBeNull();
    expect(finding?.type).toBe('high_cpu');
    expect(finding?.details.cpuDelta).toBe(50);
  });

  it('should not detect normal CPU usage', () => {
    const metrics = createMetrics({ cpuDelta: 10 });
    const finding = detectHighCpu(metrics, defaultThresholds);

    expect(finding).toBeNull();
  });
});

describe('detectMemorySpike', () => {
  it('should detect memory spike', () => {
    const metrics = createMetrics({ memoryDeltaMb: 100 });
    const finding = detectMemorySpike(metrics, defaultThresholds);

    expect(finding).not.toBeNull();
    expect(finding?.type).toBe('memory_spike');
    expect(finding?.details.memoryDeltaMb).toBe(100);
  });

  it('should not detect normal memory usage', () => {
    const metrics = createMetrics({ memoryDeltaMb: 20 });
    const finding = detectMemorySpike(metrics, defaultThresholds);

    expect(finding).toBeNull();
  });
});

describe('detectEventLoopLag', () => {
  it('should detect event loop lag', () => {
    const metrics = createMetrics({ eventLoopLagMs: 200 });
    const finding = detectEventLoopLag(metrics, defaultThresholds);

    expect(finding).not.toBeNull();
    expect(finding?.type).toBe('event_loop_lag');
  });

  it('should not detect normal lag', () => {
    const metrics = createMetrics({ eventLoopLagMs: 50 });
    const finding = detectEventLoopLag(metrics, defaultThresholds);

    expect(finding).toBeNull();
  });
});

describe('detectSilentDegradation', () => {
  it('should detect silent degradation on successful but slow action', () => {
    const metrics = createMetrics({
      durationMs: 1000,
      status: 'ok',
    });
    const finding = detectSilentDegradation(metrics, defaultThresholds);

    expect(finding).not.toBeNull();
    expect(finding?.type).toBe('silent_degradation');
    expect(finding?.message).toContain('succeeded but degraded UX');
    expect(finding?.details.issues).toContain('slow (1000ms > 500ms)');
  });

  it('should not detect on failed actions', () => {
    const metrics = createMetrics({
      durationMs: 1000,
      status: 'error',
    });
    const finding = detectSilentDegradation(metrics, defaultThresholds);

    expect(finding).toBeNull();
  });

  it('should detect multiple issues', () => {
    const metrics = createMetrics({
      durationMs: 1000,
      cpuDelta: 50,
      memoryDeltaMb: 100,
      status: 'ok',
    });
    const finding = detectSilentDegradation(metrics, defaultThresholds);

    expect(finding?.details.issues).toHaveLength(3);
  });

  it('should not detect on healthy action', () => {
    const metrics = createMetrics({
      durationMs: 100,
      cpuDelta: 5,
      memoryDeltaMb: 10,
      status: 'ok',
    });
    const finding = detectSilentDegradation(metrics, defaultThresholds);

    expect(finding).toBeNull();
  });
});

describe('runAllDetectors', () => {
  it('should run all detectors', () => {
    const metrics = createMetrics({
      durationMs: 1000,
      cpuDelta: 50,
      memoryDeltaMb: 100,
      status: 'ok',
    });

    const findings = runAllDetectors(metrics, defaultThresholds);

    // Should find: slow_action, high_cpu, memory_spike, silent_degradation
    expect(findings.length).toBeGreaterThanOrEqual(4);
    expect(findings.map((f) => f.type)).toContain('slow_action');
    expect(findings.map((f) => f.type)).toContain('high_cpu');
    expect(findings.map((f) => f.type)).toContain('memory_spike');
    expect(findings.map((f) => f.type)).toContain('silent_degradation');
  });

  it('should return empty for healthy action', () => {
    const metrics = createMetrics({
      durationMs: 100,
      cpuDelta: 5,
      memoryDeltaMb: 10,
      status: 'ok',
    });

    const findings = runAllDetectors(metrics, defaultThresholds);

    expect(findings).toHaveLength(0);
  });
});
