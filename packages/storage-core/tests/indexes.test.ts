/**
 * Tests for TraceIndex
 */

import { TraceIndex } from '../src/indexes.js';
import type { CausalityTrace } from '../src/types.js';

function createTrace(
  traceId: string,
  status: 'ok' | 'error' | 'partial',
  durationMs: number,
  actionNames: string[] = ['TestAction'],
  startTime: number = Date.now()
): CausalityTrace {
  return {
    traceId,
    startTime,
    endTime: startTime + durationMs,
    durationMs,
    status,
    actionCount: actionNames.length,
    maxDepth: 0,
    rootActions: actionNames.map((name, i) => ({
      id: `action-${i}`,
      name,
      startTime,
      endTime: startTime + durationMs,
      durationMs,
      status: 'ok' as const,
      depth: 0,
      children: [],
    })),
  };
}

describe('TraceIndex', () => {
  let index: TraceIndex;

  beforeEach(() => {
    index = new TraceIndex();
  });

  describe('add/get', () => {
    it('should add and retrieve trace entry', () => {
      const trace = createTrace('t1', 'ok', 100);
      index.add(trace);

      const entry = index.get('t1');
      expect(entry).toBeDefined();
      expect(entry?.traceId).toBe('t1');
      expect(entry?.status).toBe('ok');
      expect(entry?.durationMs).toBe(100);
    });

    it('should extract action names', () => {
      const trace = createTrace('t1', 'ok', 100, ['CreateOrder', 'ProcessPayment']);
      index.add(trace);

      const entry = index.get('t1');
      expect(entry?.actionNames).toContain('CreateOrder');
      expect(entry?.actionNames).toContain('ProcessPayment');
    });
  });

  describe('remove', () => {
    it('should remove trace from all indexes', () => {
      const trace = createTrace('t1', 'error', 100);
      index.add(trace);

      expect(index.remove('t1')).toBe(true);
      expect(index.get('t1')).toBeUndefined();
      expect(index.getByStatus('error').size).toBe(0);
    });

    it('should return false for non-existent trace', () => {
      expect(index.remove('non-existent')).toBe(false);
    });
  });

  describe('getByStatus', () => {
    it('should return traces by status', () => {
      index.add(createTrace('t1', 'ok', 100));
      index.add(createTrace('t2', 'error', 100));
      index.add(createTrace('t3', 'ok', 100));
      index.add(createTrace('t4', 'partial', 100));

      expect(index.getByStatus('ok').size).toBe(2);
      expect(index.getByStatus('error').size).toBe(1);
      expect(index.getByStatus('partial').size).toBe(1);
    });
  });

  describe('getByActionName', () => {
    it('should return traces containing action', () => {
      index.add(createTrace('t1', 'ok', 100, ['CreateOrder']));
      index.add(createTrace('t2', 'ok', 100, ['ProcessPayment']));
      index.add(createTrace('t3', 'ok', 100, ['CreateOrder', 'ProcessPayment']));

      expect(index.getByActionName('CreateOrder').size).toBe(2);
      expect(index.getByActionName('ProcessPayment').size).toBe(2);
      expect(index.getByActionName('Unknown').size).toBe(0);
    });
  });

  describe('getByDurationRange', () => {
    it('should return traces within duration range', () => {
      index.add(createTrace('t1', 'ok', 50));
      index.add(createTrace('t2', 'ok', 200));
      index.add(createTrace('t3', 'ok', 500));
      index.add(createTrace('t4', 'ok', 1000));

      // Min only
      expect(index.getByDurationRange(100).size).toBe(3);

      // Max only
      expect(index.getByDurationRange(undefined, 300).size).toBe(2);

      // Both
      expect(index.getByDurationRange(100, 600).size).toBe(2);
    });
  });

  describe('getByTimeRange', () => {
    it('should return traces within time range', () => {
      const now = Date.now();

      index.add(createTrace('t1', 'ok', 100, ['A'], now - 3000));
      index.add(createTrace('t2', 'ok', 100, ['A'], now - 2000));
      index.add(createTrace('t3', 'ok', 100, ['A'], now - 1000));
      index.add(createTrace('t4', 'ok', 100, ['A'], now));

      expect(index.getByTimeRange(now - 2500, now - 500).size).toBe(2);
    });
  });

  describe('stats', () => {
    it('should return correct statistics', () => {
      index.add(createTrace('t1', 'ok', 100, ['CreateOrder']));
      index.add(createTrace('t2', 'error', 100, ['ProcessPayment']));
      index.add(createTrace('t3', 'ok', 100, ['ValidateUser']));

      const stats = index.stats();

      expect(stats.totalTraces).toBe(3);
      expect(stats.byStatus['ok']).toBe(2);
      expect(stats.byStatus['error']).toBe(1);
      expect(stats.uniqueActions).toBe(3);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      index.add(createTrace('t1', 'ok', 100));
      index.add(createTrace('t2', 'ok', 100));

      index.clear();

      expect(index.getAllIds().size).toBe(0);
    });
  });
});
