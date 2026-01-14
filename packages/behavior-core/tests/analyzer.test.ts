/**
 * Tests for Behavior Analyzer
 */

import { BehaviorAnalyzer, createBehaviorAnalyzer, analyzeBehavior, toImpactJson } from '../src/analyzer.js';
import type { ActionMetrics, ExecutionHistory, SourceContext, ActionContext, HistoricalStats, AnalysisInput } from '../src/types.js';

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
  actionName: string = 'TestAction',
  durationMean: number = 100,
  sampleCount: number = 100
): ExecutionHistory {
  return {
    actionName,
    sampleCount,
    lastUpdated: Date.now(),
    stats: {
      duration: createStats(durationMean, durationMean * 0.2),
      cpu: createStats(10, 3),
      memory: createStats(20, 5),
    },
  };
}

function createMetrics(
  name: string = 'TestAction',
  durationMs: number = 100,
  cpuDelta: number = 10,
  memoryDeltaMb: number = 20
): ActionMetrics {
  return {
    actionId: 'act-1',
    traceId: 'trace-1',
    name,
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

const context: ActionContext = {
  actionName: 'TestAction',
  traceId: 'trace-1',
  service: 'api-gateway',
  userId: 'user-123',
};

describe('BehaviorAnalyzer', () => {
  let analyzer: BehaviorAnalyzer;

  beforeEach(() => {
    analyzer = createBehaviorAnalyzer();
  });

  describe('recordExecution', () => {
    it('should record executions', () => {
      analyzer.recordExecution(createMetrics('TestAction', 100));
      analyzer.recordExecution(createMetrics('TestAction', 150));

      const history = analyzer.getHistory('TestAction');
      expect(history).toBeDefined();
      expect(history?.sampleCount).toBe(2);
    });
  });

  describe('analyze', () => {
    it('should return null for insufficient history', () => {
      const input: AnalysisInput = {
        context,
        metrics: createMetrics(),
        history: createHistory('TestAction', 100, 5), // Only 5 samples
        source,
      };

      const result = analyzer.analyze(input);
      expect(result).toBeNull();
    });

    it('should analyze action with sufficient history', () => {
      const input: AnalysisInput = {
        context,
        metrics: createMetrics('TestAction', 200), // Anomalous
        history: createHistory('TestAction', 100, 100),
        source,
      };

      const result = analyzer.analyze(input);

      expect(result).not.toBeNull();
      expect(result?.anomaly.observedAnomaly).toBe(true);
      expect(result?.context).toBe(context);
      expect(result?.source).toBe(source);
    });

    it('should track occurrence counts', () => {
      const history = createHistory('TestAction', 100, 100);

      // First anomaly
      const result1 = analyzer.analyze({
        context,
        metrics: createMetrics('TestAction', 200),
        history,
        source,
      });

      // Second anomaly
      const result2 = analyzer.analyze({
        context,
        metrics: createMetrics('TestAction', 200),
        history,
        source,
      });

      expect(result1?.occurrenceCount).toBe(1);
      expect(result2?.occurrenceCount).toBe(2);
    });

    it('should flag for review after threshold', () => {
      const history = createHistory('TestAction', 100, 100);

      // Record enough anomalies
      for (let i = 0; i < 5; i++) {
        analyzer.analyze({
          context,
          metrics: createMetrics('TestAction', 200),
          history,
          source,
        });
      }

      const result = analyzer.analyze({
        context,
        metrics: createMetrics('TestAction', 200),
        history,
        source,
      });

      expect(result?.shouldFlag).toBe(true);
      expect(result?.anomaly.repeatSensitivity).toBe('flag');
    });
  });

  describe('canAnalyze', () => {
    it('should return false for unknown action', () => {
      expect(analyzer.canAnalyze('Unknown')).toBe(false);
    });

    it('should return true after sufficient samples', () => {
      for (let i = 0; i < 15; i++) {
        analyzer.recordExecution(createMetrics('TestAction', 100));
      }

      expect(analyzer.canAnalyze('TestAction')).toBe(true);
    });
  });

  describe('isAnomalous', () => {
    it('should check for anomalies quickly', () => {
      for (let i = 0; i < 15; i++) {
        analyzer.recordExecution(createMetrics('TestAction', 100));
      }

      expect(analyzer.isAnomalous(createMetrics('TestAction', 100))).toBe(false);
      expect(analyzer.isAnomalous(createMetrics('TestAction', 200))).toBe(true);
    });
  });

  describe('export/import', () => {
    it('should export and import state', () => {
      for (let i = 0; i < 15; i++) {
        analyzer.recordExecution(createMetrics('TestAction', 100 + i * 10));
      }

      const exported = analyzer.export();

      const newAnalyzer = createBehaviorAnalyzer();
      newAnalyzer.import(exported);

      expect(newAnalyzer.canAnalyze('TestAction')).toBe(true);
    });
  });
});

describe('analyzeBehavior (stateless)', () => {
  it('should analyze without state', () => {
    const input: AnalysisInput = {
      context,
      metrics: createMetrics('TestAction', 200),
      history: createHistory('TestAction', 100, 100),
      source,
    };

    const result = analyzeBehavior(input);

    expect(result).not.toBeNull();
    expect(result?.anomaly.observedAnomaly).toBe(true);
  });
});

describe('toImpactJson', () => {
  it('should produce valid JSON', () => {
    const input: AnalysisInput = {
      context,
      metrics: createMetrics('TestAction', 200),
      history: createHistory('TestAction', 100, 100),
      source,
    };

    const result = analyzeBehavior(input)!;
    const json = toImpactJson(result);

    const parsed = JSON.parse(json);

    expect(parsed.actionName).toBe('TestAction');
    expect(parsed.file).toBe('src/handlers/test.ts');
    expect(parsed.function).toBe('handleTest');
    expect(parsed.metricsObserved).toBeDefined();
    expect(parsed.metricsExpected).toBeDefined();
    expect(parsed.observedAnomaly).toBe(true);
    expect(parsed.confidence).toBeGreaterThan(0);
    expect(parsed.repeatSensitivity).toBeDefined();
    expect(parsed.reason).toBeDefined();
  });
});

describe('Success Criterion: Deterministic JSON Output', () => {
  it('should produce deterministic output for same input', () => {
    const input: AnalysisInput = {
      context,
      metrics: createMetrics('ProcessPayment', 500, 30, 80),
      history: createHistory('ProcessPayment', 100, 100),
      source: {
        file: 'src/payment/processor.ts',
        function: 'processPayment',
      },
    };

    const result1 = analyzeBehavior(input)!;
    const result2 = analyzeBehavior(input)!;

    // Compare JSON output
    const json1 = toImpactJson(result1);
    const json2 = toImpactJson(result2);

    expect(json1).toBe(json2);

    // Verify structure matches requirement
    const parsed = JSON.parse(json1);

    expect(parsed).toMatchObject({
      actionName: 'ProcessPayment',
      file: 'src/payment/processor.ts',
      function: 'processPayment',
      metricsObserved: {
        durationMs: 500,
        cpuDelta: 30,
        memoryDeltaMb: 80,
      },
      observedAnomaly: true,
      repeatSensitivity: expect.stringMatching(/singleOccurrence|flag/),
    });

    expect(parsed.metricsExpected.cpu).toMatch(/low|medium|high/);
    expect(parsed.metricsExpected.memory).toMatch(/low|medium|high/);
    expect(parsed.confidence).toBeGreaterThanOrEqual(0);
    expect(parsed.confidence).toBeLessThanOrEqual(1);
  });
});
