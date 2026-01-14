/**
 * Tests for Aggregator
 */

import { Aggregator } from '../src/aggregator.js';
import type { EnrichedExplanation } from '../src/types.js';

function createMockTrace(
  id: string, 
  actionName: string, 
  duration: number,
  status: 'ok' | 'error' = 'ok'
): EnrichedExplanation {
  return {
    traceId: id,
    actionName,
    serviceName: 'test-service',
    service: 'microservice',
    file: 'src/test.ts',
    function: 'testFunction',
    metricsObserved: {
      durationMs: duration,
      cpuDelta: 10,
      memoryDeltaMb: 5,
    },
    metricsExpected: {
      cpu: 'low',
      memory: 'low',
      durationMs: 50,
      thresholds: { durationP95: 100, durationP99: 150, cpuP95: 20, memoryP95: 20 }
    },
    anomalies: [],
    impactScore: status === 'error' ? 80 : 10,
    causalChain: [
        { actionName, service: 'test-service', serviceType: 'microservice', file: '', function: '', startTime: 0, status: status === 'error' ? 'error' : 'ok' }
    ],
    inputs: {},
    replayInstructions: [],
    audience: { primary: 'developer', secondary: [], reason: '' },
    policyAction: 'store',
    generatedAt: Date.now(),
    summary: 'Test summary'
  };
}

describe('Aggregator', () => {
  let aggregator: Aggregator;

  beforeEach(() => {
    aggregator = new Aggregator();
  });

  it('should aggregate simple traces', () => {
    aggregator.process(createMockTrace('t1', 'ActionA', 100));
    aggregator.process(createMockTrace('t2', 'ActionA', 200));

    const stats = aggregator.getStats('test-service', 'testFunction', 'ActionA');
    
    expect(stats).toBeDefined();
    expect(stats?.totalExecutions).toBe(2);
    expect(stats?.avgDurationMs).toBe(150); // (100+200)/2
    expect(stats?.maxDurationMs).toBe(200);
  });

  it('should count failures', () => {
    aggregator.process(createMockTrace('t1', 'ActionB', 100, 'ok'));
    aggregator.process(createMockTrace('t2', 'ActionB', 100, 'error'));

    const stats = aggregator.getStats('test-service', 'testFunction', 'ActionB');
    
    expect(stats?.totalExecutions).toBe(2);
    expect(stats?.totalFailures).toBe(1);
  });

  it('should maintain recent history window', () => {
    const limit = 5;
    aggregator = new Aggregator({ maxHistorySize: limit });

    for (let i = 0; i < 10; i++) {
        aggregator.process(createMockTrace(`t${i}`, 'ActionC', 100));
    }

    const stats = aggregator.getStats('test-service', 'testFunction', 'ActionC');
    expect(stats?.recentHistory.length).toBe(limit);
    expect(stats?.recentHistory[limit - 1].traceId).toBe('t9');
  });
});
