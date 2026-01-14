/**
 * Tests for MetricsCorrelator
 */

import { MetricsCorrelator } from '../src/correlator.js';
import { ResourceSampler } from '../src/sampler.js';
import type { ActionEvent } from '../src/types.js';

function createStartEvent(
  id: string,
  traceId: string,
  name: string = 'TestAction'
): ActionEvent {
  return {
    type: 'action.start',
    action: {
      id,
      name,
      traceId,
      startTime: Date.now(),
      status: 'running',
    },
  };
}

function createEndEvent(
  id: string,
  traceId: string,
  name: string = 'TestAction',
  status: 'ok' | 'error' = 'ok',
  startTime?: number
): ActionEvent {
  const start = startTime ?? Date.now() - 100;
  return {
    type: 'action.end',
    action: {
      id,
      name,
      traceId,
      startTime: start,
      endTime: Date.now(),
      status,
    },
  };
}

describe('MetricsCorrelator', () => {
  let correlator: MetricsCorrelator;

  beforeEach(() => {
    correlator = new MetricsCorrelator();
  });

  describe('ingest', () => {
    it('should track action on start', () => {
      correlator.ingest(createStartEvent('a1', 't1'));

      expect(correlator.activeCount()).toBe(1);
      expect(correlator.completedCount()).toBe(0);
    });

    it('should produce ActionMetrics on end', () => {
      correlator.ingest(createStartEvent('a1', 't1'));
      const metrics = correlator.ingest(createEndEvent('a1', 't1'));

      expect(metrics).not.toBeNull();
      expect(metrics?.actionId).toBe('a1');
      expect(metrics?.traceId).toBe('t1');
    });

    it('should remove action from active on end', () => {
      correlator.ingest(createStartEvent('a1', 't1'));
      correlator.ingest(createEndEvent('a1', 't1'));

      expect(correlator.activeCount()).toBe(0);
      expect(correlator.completedCount()).toBe(1);
    });

    it('should handle end without start', () => {
      const metrics = correlator.ingest(createEndEvent('a1', 't1'));

      expect(metrics).not.toBeNull();
      expect(correlator.completedCount()).toBe(1);
    });
  });

  describe('ActionMetrics content', () => {
    it('should capture correct action info', () => {
      correlator.ingest(createStartEvent('a1', 't1', 'ProcessPayment'));
      const metrics = correlator.ingest(
        createEndEvent('a1', 't1', 'ProcessPayment', 'ok')
      );

      expect(metrics?.name).toBe('ProcessPayment');
      expect(metrics?.status).toBe('ok');
    });

    it('should capture error status', () => {
      correlator.ingest(createStartEvent('a1', 't1'));
      const metrics = correlator.ingest(
        createEndEvent('a1', 't1', 'TestAction', 'error')
      );

      expect(metrics?.status).toBe('error');
    });

    it('should include metric snapshots', () => {
      correlator.ingest(createStartEvent('a1', 't1'));
      const metrics = correlator.ingest(createEndEvent('a1', 't1'));

      expect(metrics?.metrics.start).toBeDefined();
      expect(metrics?.metrics.end).toBeDefined();
      expect(metrics?.metrics.delta).toBeDefined();
    });

    it('should calculate duration', () => {
      const startTime = Date.now() - 200;

      correlator.ingest({
        type: 'action.start',
        action: {
          id: 'a1',
          name: 'Test',
          traceId: 't1',
          startTime,
          status: 'running',
        },
      });

      const metrics = correlator.ingest({
        type: 'action.end',
        action: {
          id: 'a1',
          name: 'Test',
          traceId: 't1',
          startTime,
          endTime: startTime + 200,
          status: 'ok',
        },
      });

      expect(metrics?.durationMs).toBe(200);
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      correlator.ingest(createStartEvent('a1', 't1', 'Action1'));
      correlator.ingest(createEndEvent('a1', 't1', 'Action1'));
      correlator.ingest(createStartEvent('a2', 't1', 'Action2'));
      correlator.ingest(createEndEvent('a2', 't1', 'Action2'));
      correlator.ingest(createStartEvent('a3', 't2', 'Action3'));
      correlator.ingest(createEndEvent('a3', 't2', 'Action3'));
    });

    it('should get all completed metrics', () => {
      const all = correlator.getCompletedMetrics();
      expect(all).toHaveLength(3);
    });

    it('should get metrics by action id', () => {
      const metrics = correlator.getMetrics('a2');
      expect(metrics?.name).toBe('Action2');
    });

    it('should get metrics by trace', () => {
      const t1Metrics = correlator.getMetricsByTrace('t1');
      expect(t1Metrics).toHaveLength(2);

      const t2Metrics = correlator.getMetricsByTrace('t2');
      expect(t2Metrics).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      correlator.ingest(createStartEvent('a1', 't1'));
      correlator.ingest(createEndEvent('a1', 't1'));

      correlator.clear();

      expect(correlator.activeCount()).toBe(0);
      expect(correlator.completedCount()).toBe(0);
    });
  });
});
