/**
 * Tests for Trace Builder
 */

import { buildTrace } from '../src/trace-builder.js';
import type { ActionEvent, TraceBuffer } from '../src/types.js';

function createBuffer(traceId: string, events: ActionEvent[]): TraceBuffer {
  return {
    traceId,
    events,
    firstEventTime: Date.now(),
    lastEventTime: Date.now(),
  };
}

function start(
  id: string,
  name: string,
  traceId: string,
  parentId?: string,
  attributes?: Record<string, unknown>
): ActionEvent {
  return {
    type: 'action.start',
    action: {
      id,
      name,
      traceId,
      parentId,
      startTime: 1000,
      status: 'running',
      attributes,
    },
  };
}

function end(
  id: string,
  name: string,
  traceId: string,
  status: 'ok' | 'error' = 'ok',
  parentId?: string,
  attributes?: Record<string, unknown>,
  error?: { message: string; stack?: string }
): ActionEvent {
  return {
    type: 'action.end',
    action: {
      id,
      name,
      traceId,
      parentId,
      startTime: 1000,
      endTime: 1100,
      status,
      attributes,
      error,
    },
  };
}

describe('buildTrace', () => {
  describe('basic reconstruction', () => {
    it('should build trace from single action', () => {
      const buffer = createBuffer('t1', [
        start('a1', 'CreateOrder', 't1'),
        end('a1', 'CreateOrder', 't1'),
      ]);

      const { trace, warnings } = buildTrace(buffer);

      expect(trace.traceId).toBe('t1');
      expect(trace.status).toBe('ok');
      expect(trace.actionCount).toBe(1);
      expect(trace.rootActions).toHaveLength(1);
      expect(trace.rootActions[0].name).toBe('CreateOrder');
      expect(warnings).toHaveLength(0);
    });

    it('should calculate duration', () => {
      const buffer = createBuffer('t1', [
        start('a1', 'Action', 't1'),
        end('a1', 'Action', 't1'),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.durationMs).toBe(100);
      expect(trace.rootActions[0].durationMs).toBe(100);
    });

    it('should preserve attributes', () => {
      const buffer = createBuffer('t1', [
        start('a1', 'Action', 't1', undefined, { key1: 'value1' }),
        end('a1', 'Action', 't1', 'ok', undefined, { key2: 'value2' }),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.rootActions[0].attributes).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });
  });

  describe('nested actions', () => {
    it('should build parent-child relationships', () => {
      const buffer = createBuffer('t1', [
        start('parent', 'Parent', 't1'),
        start('child', 'Child', 't1', 'parent'),
        end('child', 'Child', 't1', 'ok', 'parent'),
        end('parent', 'Parent', 't1'),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.rootActions).toHaveLength(1);
      expect(trace.rootActions[0].name).toBe('Parent');
      expect(trace.rootActions[0].children).toHaveLength(1);
      expect(trace.rootActions[0].children[0].name).toBe('Child');
    });

    it('should calculate depth correctly', () => {
      const buffer = createBuffer('t1', [
        start('l1', 'Level1', 't1'),
        start('l2', 'Level2', 't1', 'l1'),
        start('l3', 'Level3', 't1', 'l2'),
        end('l3', 'Level3', 't1', 'ok', 'l2'),
        end('l2', 'Level2', 't1', 'ok', 'l1'),
        end('l1', 'Level1', 't1'),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.maxDepth).toBe(2);
      expect(trace.rootActions[0].depth).toBe(0);
      expect(trace.rootActions[0].children[0].depth).toBe(1);
      expect(trace.rootActions[0].children[0].children[0].depth).toBe(2);
    });

    it('should handle multiple root actions', () => {
      const buffer = createBuffer('t1', [
        start('a1', 'Action1', 't1'),
        end('a1', 'Action1', 't1'),
        start('a2', 'Action2', 't1'),
        end('a2', 'Action2', 't1'),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.rootActions).toHaveLength(2);
    });
  });

  describe('out of order events', () => {
    it('should handle end before start', () => {
      const buffer = createBuffer('t1', [
        end('a1', 'Action', 't1'),
        start('a1', 'Action', 't1'),
      ]);

      const { trace, warnings } = buildTrace(buffer);

      expect(trace.actionCount).toBe(1);
      expect(warnings).toContain('action.end without matching start: a1');
    });

    it('should handle interleaved nested events', () => {
      const buffer = createBuffer('t1', [
        start('parent', 'Parent', 't1'),
        start('child1', 'Child1', 't1', 'parent'),
        start('child2', 'Child2', 't1', 'parent'),
        end('child1', 'Child1', 't1', 'ok', 'parent'),
        end('child2', 'Child2', 't1', 'ok', 'parent'),
        end('parent', 'Parent', 't1'),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.rootActions[0].children).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should mark trace as error if any action failed', () => {
      const buffer = createBuffer('t1', [
        start('a1', 'Action', 't1'),
        end('a1', 'Action', 't1', 'error', undefined, undefined, {
          message: 'Something failed',
        }),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.status).toBe('error');
      expect(trace.rootActions[0].error?.message).toBe('Something failed');
    });

    it('should preserve error details', () => {
      const buffer = createBuffer('t1', [
        start('a1', 'Action', 't1'),
        end('a1', 'Action', 't1', 'error', undefined, undefined, {
          message: 'Error message',
          stack: 'Error stack trace',
        }),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.rootActions[0].error).toEqual({
        message: 'Error message',
        stack: 'Error stack trace',
      });
    });
  });

  describe('incomplete traces', () => {
    it('should mark trace as partial if actions are incomplete', () => {
      const buffer = createBuffer('t1', [
        start('a1', 'Action', 't1'),
        // No end event
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.status).toBe('partial');
      expect(trace.rootActions[0].status).toBe('incomplete');
    });

    it('should mark action as incomplete without duration', () => {
      const buffer = createBuffer('t1', [
        start('a1', 'Action', 't1'),
      ]);

      const { trace } = buildTrace(buffer);

      expect(trace.rootActions[0].durationMs).toBeUndefined();
      expect(trace.rootActions[0].endTime).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle missing parent', () => {
      const buffer = createBuffer('t1', [
        start('child', 'Child', 't1', 'missing-parent'),
        end('child', 'Child', 't1', 'ok', 'missing-parent'),
      ]);

      const { trace, warnings } = buildTrace(buffer);

      expect(trace.rootActions).toHaveLength(1);
      expect(warnings).toContain('Missing parent: missing-parent for action child');
    });

    it('should detect cycles', () => {
      // Create a pathological case where parentId forms a cycle
      const buffer = createBuffer('t1', [
        {
          type: 'action.start',
          action: {
            id: 'a1',
            name: 'A1',
            traceId: 't1',
            parentId: 'a2', // Points to a2
            startTime: 1000,
            status: 'running',
          },
        },
        {
          type: 'action.start',
          action: {
            id: 'a2',
            name: 'A2',
            traceId: 't1',
            parentId: 'a1', // Points back to a1 - cycle!
            startTime: 1000,
            status: 'running',
          },
        },
        {
          type: 'action.end',
          action: {
            id: 'a1',
            name: 'A1',
            traceId: 't1',
            parentId: 'a2',
            startTime: 1000,
            endTime: 1100,
            status: 'ok',
          },
        },
        {
          type: 'action.end',
          action: {
            id: 'a2',
            name: 'A2',
            traceId: 't1',
            parentId: 'a1',
            startTime: 1000,
            endTime: 1100,
            status: 'ok',
          },
        },
      ]);

      const { trace, warnings } = buildTrace(buffer);

      // Should handle gracefully
      expect(trace.status).toBe('partial');
      expect(warnings.some((w) => w.includes('Cycle'))).toBe(true);
    });
  });
});
