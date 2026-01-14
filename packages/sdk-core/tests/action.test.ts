/**
 * Tests for Action model
 */

import { runAction, startAction, getCurrentAction, onActionEvent } from '../src/index.js';
import { clearActionEventListeners } from '../src/emitter.js';
import type { ActionEvent } from '../src/index.js';

describe('Action', () => {
  let events: ActionEvent[];
  let unsubscribe: () => void;

  beforeEach(() => {
    clearActionEventListeners();
    events = [];
    unsubscribe = onActionEvent((event) => {
      events.push(event);
    });
  });

  afterEach(() => {
    unsubscribe();
    clearActionEventListeners();
  });

  describe('runAction', () => {
    it('should emit start and end events', async () => {
      await runAction('TestAction', async () => {
        // do nothing
      });

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('action.start');
      expect(events[1].type).toBe('action.end');
    });

    it('should have consistent action data', async () => {
      await runAction('TestAction', async () => {});

      const startEvent = events[0];
      const endEvent = events[1];

      expect(startEvent.action.name).toBe('TestAction');
      expect(endEvent.action.name).toBe('TestAction');
      expect(startEvent.action.id).toBe(endEvent.action.id);
      expect(startEvent.action.traceId).toBe(endEvent.action.traceId);
    });

    it('should set status to ok on success', async () => {
      await runAction('SuccessAction', async () => {
        return 'result';
      });

      const endEvent = events[1];
      expect(endEvent.action.status).toBe('ok');
    });

    it('should set status to error on failure', async () => {
      try {
        await runAction('FailingAction', async () => {
          throw new Error('Test error');
        });
      } catch {
        // expected
      }

      const endEvent = events[1];
      expect(endEvent.action.status).toBe('error');
      expect(endEvent.action.error?.message).toBe('Test error');
    });

    it('should return the function result', async () => {
      const result = await runAction('ReturnAction', async () => {
        return { value: 42 };
      });

      expect(result).toEqual({ value: 42 });
    });

    it('should propagate errors', async () => {
      await expect(
        runAction('ErrorAction', async () => {
          throw new Error('Propagated error');
        })
      ).rejects.toThrow('Propagated error');
    });

    it('should have running status only at start', async () => {
      await runAction('StatusAction', async () => {});

      expect(events[0].action.status).toBe('running');
      expect(events[1].action.status).not.toBe('running');
    });
  });

  describe('startAction', () => {
    it('should emit start event immediately', () => {
      const action = startAction('ManualAction');

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('action.start');

      action.end();
    });

    it('should emit end event on end()', () => {
      const action = startAction('ManualAction');
      action.end();

      expect(events).toHaveLength(2);
      expect(events[1].type).toBe('action.end');
      expect(events[1].action.status).toBe('ok');
    });

    it('should emit error on end(error)', () => {
      const action = startAction('ManualAction');
      action.end(new Error('Manual error'));

      expect(events[1].action.status).toBe('error');
      expect(events[1].action.error?.message).toBe('Manual error');
    });

    it('should allow setting attributes', () => {
      const action = startAction('AttributeAction');
      action.setAttribute('userId', 'user-123');
      action.setAttribute('amount', 100);
      action.end();

      const endEvent = events[1];
      expect(endEvent.action.attributes).toEqual({
        userId: 'user-123',
        amount: 100,
      });
    });

    it('should expose id and traceId', () => {
      const action = startAction('ExposeAction');

      expect(action.id).toBeDefined();
      expect(action.traceId).toBeDefined();
      expect(typeof action.id).toBe('string');
      expect(typeof action.traceId).toBe('string');

      action.end();
    });

    it('should ignore multiple end() calls', () => {
      const action = startAction('MultiEndAction');
      action.end();
      action.end();
      action.end();

      // Only one end event
      expect(events.filter((e) => e.type === 'action.end')).toHaveLength(1);
    });
  });

  describe('ActionOptions', () => {
    it('should accept string input', async () => {
      await runAction('StringInput', async () => {});

      expect(events[0].action.name).toBe('StringInput');
    });

    it('should accept object input', async () => {
      await runAction({ name: 'ObjectInput' }, async () => {});

      expect(events[0].action.name).toBe('ObjectInput');
    });

    it('should accept initial attributes', async () => {
      await runAction(
        { name: 'WithAttributes', attributes: { source: 'test' } },
        async () => {}
      );

      expect(events[0].action.attributes).toEqual({ source: 'test' });
    });
  });
});
