/**
 * Tests for Collector
 */

import { jest } from '@jest/globals';
import { createCollector } from '../src/collector.js';
import { InMemoryTransport, NullTransport } from '../src/transport.js';
import type { ActionEvent, Collector } from '../src/types.js';

function start(id: string, traceId: string, parentId?: string): ActionEvent {
  return {
    type: 'action.start',
    action: {
      id,
      name: `Action-${id}`,
      traceId,
      parentId,
      startTime: Date.now(),
      status: 'running',
    },
  };
}

function end(
  id: string,
  traceId: string,
  status: 'ok' | 'error' = 'ok',
  parentId?: string
): ActionEvent {
  return {
    type: 'action.end',
    action: {
      id,
      name: `Action-${id}`,
      traceId,
      parentId,
      startTime: Date.now() - 50,
      endTime: Date.now(),
      status,
    },
  };
}

describe('Collector', () => {
  let collector: Collector;
  let transport: InMemoryTransport;

  beforeEach(() => {
    transport = new InMemoryTransport();
  });

  afterEach(async () => {
    if (collector) {
      await collector.stop();
    }
  });

  describe('ingest', () => {
    it('should accept events without error', () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      expect(() => {
        collector.ingest(start('a1', 't1'));
        collector.ingest(end('a1', 't1'));
      }).not.toThrow();
    });

    it('should track buffered events in stats', () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      collector.ingest(start('a1', 't1'));
      collector.ingest(end('a1', 't1'));

      const stats = collector.stats();
      expect(stats.bufferedEvents).toBe(2);
      expect(stats.bufferedTraces).toBe(1);
    });

    it('should ignore events after stop', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      await collector.stop();

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      collector.ingest(start('a1', 't1'));

      expect(consoleSpy).toHaveBeenCalledWith(
        '[causality] Collector stopped, ignoring event'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('flush', () => {
    it('should send complete traces to transport', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      collector.ingest(start('a1', 't1'));
      collector.ingest(end('a1', 't1'));

      await collector.flush();

      expect(transport.count()).toBe(1);
      expect(transport.getTrace('t1')).toBeDefined();
    });

    it('should flush multiple traces', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      collector.ingest(start('a1', 't1'));
      collector.ingest(end('a1', 't1'));
      collector.ingest(start('a2', 't2'));
      collector.ingest(end('a2', 't2'));

      await collector.flush();

      expect(transport.count()).toBe(2);
    });

    it('should update stats after flush', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      collector.ingest(start('a1', 't1'));
      collector.ingest(end('a1', 't1'));

      await collector.flush();

      const stats = collector.stats();
      expect(stats.bufferedTraces).toBe(0);
      expect(stats.flushedTraces).toBe(1);
      expect(stats.flushedEvents).toBe(2);
    });
  });

  describe('size-based flush', () => {
    it('should trigger flush when buffer exceeds maxBufferSize', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
        maxBufferSize: 2,
        traceTimeoutMs: 0, // Immediate timeout for testing
      });

      collector.ingest(start('a1', 't1'));
      collector.ingest(end('a1', 't1'));

      // Wait a bit for async flush
      await new Promise((r) => setTimeout(r, 50));

      expect(transport.count()).toBe(1);
    });
  });

  describe('stop', () => {
    it('should flush remaining traces on stop', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      collector.ingest(start('a1', 't1'));
      collector.ingest(end('a1', 't1'));

      await collector.stop();

      expect(transport.count()).toBe(1);
    });

    it('should call transport close', async () => {
      const sendMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const closeMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      
      const closeableTransport = {
        send: sendMock,
        close: closeMock,
      };

      collector = createCollector({
        transport: closeableTransport,
        flushIntervalMs: 60000,
      });

      await collector.stop();

      expect(closeMock).toHaveBeenCalled();
    });
  });

  describe('periodic flush', () => {
    it('should flush on interval', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 50,
        traceTimeoutMs: 0,
      });

      collector.ingest(start('a1', 't1'));
      collector.ingest(end('a1', 't1'));

      // Wait for interval
      await new Promise((r) => setTimeout(r, 100));

      expect(transport.count()).toBe(1);
    });
  });

  describe('trace reconstruction', () => {
    it('should reconstruct nested traces correctly', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      collector.ingest(start('parent', 't1'));
      collector.ingest(start('child', 't1', 'parent'));
      collector.ingest(end('child', 't1', 'ok', 'parent'));
      collector.ingest(end('parent', 't1'));

      await collector.flush();

      const trace = transport.getTrace('t1');
      expect(trace?.rootActions).toHaveLength(1);
      expect(trace?.rootActions[0].children).toHaveLength(1);
    });

    it('should mark trace as error if any action failed', async () => {
      collector = createCollector({
        transport,
        flushIntervalMs: 60000,
      });

      collector.ingest(start('a1', 't1'));
      collector.ingest(end('a1', 't1', 'error'));

      await collector.flush();

      const trace = transport.getTrace('t1');
      expect(trace?.status).toBe('error');
    });
  });
});
