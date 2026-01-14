/**
 * Tests for EventBuffer
 */

import { EventBuffer } from '../src/buffer.js';
import type { ActionEvent } from '../src/types.js';

function createStartEvent(
  id: string,
  traceId: string,
  parentId?: string
): ActionEvent {
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

function createEndEvent(
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
      startTime: Date.now() - 100,
      endTime: Date.now(),
      status,
    },
  };
}

describe('EventBuffer', () => {
  let buffer: EventBuffer;

  beforeEach(() => {
    buffer = new EventBuffer();
  });

  describe('add', () => {
    it('should add events and group by traceId', () => {
      buffer.add(createStartEvent('a1', 'trace-1'));
      buffer.add(createStartEvent('a2', 'trace-1'));
      buffer.add(createStartEvent('a3', 'trace-2'));

      expect(buffer.getTraceIds()).toHaveLength(2);
      expect(buffer.getTraceIds()).toContain('trace-1');
      expect(buffer.getTraceIds()).toContain('trace-2');
    });

    it('should track event counts correctly', () => {
      buffer.add(createStartEvent('a1', 'trace-1'));
      buffer.add(createEndEvent('a1', 'trace-1'));
      buffer.add(createStartEvent('a2', 'trace-2'));

      const stats = buffer.stats();
      expect(stats.traceCount).toBe(2);
      expect(stats.eventCount).toBe(3);
    });
  });

  describe('getTrace', () => {
    it('should return trace buffer by id', () => {
      buffer.add(createStartEvent('a1', 'trace-1'));
      buffer.add(createEndEvent('a1', 'trace-1'));

      const trace = buffer.getTrace('trace-1');
      expect(trace).toBeDefined();
      expect(trace?.traceId).toBe('trace-1');
      expect(trace?.events).toHaveLength(2);
    });

    it('should return undefined for unknown trace', () => {
      expect(buffer.getTrace('unknown')).toBeUndefined();
    });
  });

  describe('extractTrace', () => {
    it('should remove trace from buffer', () => {
      buffer.add(createStartEvent('a1', 'trace-1'));
      buffer.add(createStartEvent('a2', 'trace-2'));

      const extracted = buffer.extractTrace('trace-1');
      expect(extracted?.traceId).toBe('trace-1');
      expect(buffer.getTraceIds()).toEqual(['trace-2']);
    });

    it('should update stats after extraction', () => {
      buffer.add(createStartEvent('a1', 'trace-1'));
      buffer.add(createEndEvent('a1', 'trace-1'));

      expect(buffer.stats().eventCount).toBe(2);

      buffer.extractTrace('trace-1');

      expect(buffer.stats().eventCount).toBe(0);
      expect(buffer.stats().traceCount).toBe(0);
    });
  });

  describe('extractReadyTraces', () => {
    it('should extract complete traces', () => {
      buffer.add(createStartEvent('a1', 'trace-1'));
      buffer.add(createEndEvent('a1', 'trace-1'));

      const ready = buffer.extractReadyTraces(60000);
      expect(ready).toHaveLength(1);
      expect(ready[0].traceId).toBe('trace-1');
    });

    it('should not extract incomplete traces within timeout', () => {
      buffer.add(createStartEvent('a1', 'trace-1'));
      // No end event

      const ready = buffer.extractReadyTraces(60000);
      expect(ready).toHaveLength(0);
    });

    it('should extract timed-out incomplete traces', async () => {
      buffer.add(createStartEvent('a1', 'trace-1'));

      // Wait a bit for time to pass
      await new Promise((r) => setTimeout(r, 10));

      // Now extract with a short timeout (1ms)
      const ready = buffer.extractReadyTraces(1);
      expect(ready).toHaveLength(1);
    });

    it('should handle nested actions correctly', () => {
      buffer.add(createStartEvent('parent', 'trace-1'));
      buffer.add(createStartEvent('child', 'trace-1', 'parent'));
      buffer.add(createEndEvent('child', 'trace-1', 'ok', 'parent'));
      buffer.add(createEndEvent('parent', 'trace-1'));

      const ready = buffer.extractReadyTraces(60000);
      expect(ready).toHaveLength(1);
      expect(ready[0].events).toHaveLength(4);
    });
  });

  describe('extractAll', () => {
    it('should extract all traces', () => {
      buffer.add(createStartEvent('a1', 'trace-1'));
      buffer.add(createStartEvent('a2', 'trace-2'));
      buffer.add(createStartEvent('a3', 'trace-3'));

      const all = buffer.extractAll();
      expect(all).toHaveLength(3);
      expect(buffer.stats().traceCount).toBe(0);
    });
  });

  describe('exceedsSize', () => {
    it('should detect when buffer exceeds size', () => {
      expect(buffer.exceedsSize(2)).toBe(false);

      buffer.add(createStartEvent('a1', 'trace-1'));
      expect(buffer.exceedsSize(2)).toBe(false);

      buffer.add(createEndEvent('a1', 'trace-1'));
      expect(buffer.exceedsSize(2)).toBe(true);
    });
  });
});
