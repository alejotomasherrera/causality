/**
 * Tests for Execution History Store
 */

import { ExecutionHistoryStore, createHistoryStore } from '../src/history.js';
import type { ActionMetrics } from '../src/types.js';

function createMetrics(
  name: string,
  durationMs: number,
  cpuDelta: number = 10,
  memoryDeltaMb: number = 20
): ActionMetrics {
  return {
    actionId: `action-${Date.now()}`,
    traceId: `trace-${Date.now()}`,
    name,
    startTime: Date.now(),
    endTime: Date.now() + durationMs,
    durationMs,
    status: 'ok',
    metrics: {
      start: { timestamp: Date.now(), cpuUsage: 10, memoryRssMb: 100, heapUsedMb: 50 },
      end: { timestamp: Date.now() + durationMs, cpuUsage: 10 + cpuDelta, memoryRssMb: 100 + memoryDeltaMb, heapUsedMb: 50 + memoryDeltaMb / 2 },
      delta: { durationMs, cpuDelta, memoryDeltaMb, heapDeltaMb: memoryDeltaMb / 2 },
    },
  };
}

describe('ExecutionHistoryStore', () => {
  let store: ExecutionHistoryStore;

  beforeEach(() => {
    store = createHistoryStore();
  });

  describe('record', () => {
    it('should record executions', () => {
      store.record(createMetrics('TestAction', 100));
      store.record(createMetrics('TestAction', 150));

      const history = store.get('TestAction');
      expect(history).toBeDefined();
      expect(history?.sampleCount).toBe(2);
    });

    it('should track separate histories per action', () => {
      store.record(createMetrics('ActionA', 100));
      store.record(createMetrics('ActionB', 200));

      expect(store.get('ActionA')?.sampleCount).toBe(1);
      expect(store.get('ActionB')?.sampleCount).toBe(1);
    });
  });

  describe('get', () => {
    it('should return undefined for unknown action', () => {
      expect(store.get('Unknown')).toBeUndefined();
    });

    it('should return stats with recorded data', () => {
      store.record(createMetrics('TestAction', 100, 10, 20));
      store.record(createMetrics('TestAction', 200, 20, 40));

      const history = store.get('TestAction');

      expect(history?.stats.duration.mean).toBe(150);
      expect(history?.stats.cpu.mean).toBe(15);
      expect(history?.stats.memory.mean).toBe(30);
    });
  });

  describe('hasReliableHistory', () => {
    it('should return false with insufficient samples', () => {
      store.record(createMetrics('TestAction', 100));
      expect(store.hasReliableHistory('TestAction', 10)).toBe(false);
    });

    it('should return true with sufficient samples', () => {
      for (let i = 0; i < 10; i++) {
        store.record(createMetrics('TestAction', 100 + i * 10));
      }
      expect(store.hasReliableHistory('TestAction', 10)).toBe(true);
    });
  });

  describe('percentiles', () => {
    it('should calculate p95 correctly', () => {
      // Record 100 samples with increasing durations
      for (let i = 1; i <= 100; i++) {
        store.record(createMetrics('TestAction', i * 10));
      }

      const history = store.get('TestAction');

      expect(history?.stats.duration.p95).toBeGreaterThan(900);
      expect(history?.stats.duration.p95).toBeLessThanOrEqual(1000);
    });
  });

  describe('export/import', () => {
    it('should export and import history', () => {
      store.record(createMetrics('TestAction', 100));
      store.record(createMetrics('TestAction', 200));

      const exported = store.export();

      const newStore = createHistoryStore();
      newStore.import(exported);

      const history = newStore.get('TestAction');
      expect(history).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear specific action', () => {
      store.record(createMetrics('ActionA', 100));
      store.record(createMetrics('ActionB', 100));

      store.clear('ActionA');

      expect(store.get('ActionA')).toBeUndefined();
      expect(store.get('ActionB')).toBeDefined();
    });

    it('should clear all actions', () => {
      store.record(createMetrics('ActionA', 100));
      store.record(createMetrics('ActionB', 100));

      store.clearAll();

      expect(store.getActionNames()).toHaveLength(0);
    });
  });
});
