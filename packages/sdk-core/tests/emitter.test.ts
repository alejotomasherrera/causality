/**
 * Tests for Event Emitter
 */

import { jest } from '@jest/globals';
import { onActionEvent } from '../src/index.js';
import { emitActionEvent, clearActionEventListeners } from '../src/emitter.js';
import type { ActionEvent } from '../src/index.js';

describe('Event Emitter', () => {
  beforeEach(() => {
    clearActionEventListeners();
  });

  afterEach(() => {
    clearActionEventListeners();
  });

  const createTestEvent = (): ActionEvent => ({
    type: 'action.start',
    action: {
      id: 'test-id',
      name: 'TestAction',
      traceId: 'test-trace',
      startTime: Date.now(),
      status: 'running',
    },
  });

  describe('onActionEvent', () => {
    it('should deliver events to listeners', () => {
      const received: ActionEvent[] = [];
      onActionEvent((event) => received.push(event));

      const testEvent = createTestEvent();
      emitActionEvent(testEvent);

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual(testEvent);
    });

    it('should support multiple listeners', () => {
      let count1 = 0;
      let count2 = 0;

      onActionEvent(() => count1++);
      onActionEvent(() => count2++);

      emitActionEvent(createTestEvent());

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });

    it('should return unsubscribe function', () => {
      const received: ActionEvent[] = [];
      const unsubscribe = onActionEvent((event) => received.push(event));

      emitActionEvent(createTestEvent());
      expect(received).toHaveLength(1);

      unsubscribe();

      emitActionEvent(createTestEvent());
      expect(received).toHaveLength(1);
    });
  });

  describe('best-effort behavior', () => {
    it('should not throw if listener throws', () => {
      onActionEvent(() => {
        throw new Error('Listener error');
      });

      // Should not throw
      expect(() => emitActionEvent(createTestEvent())).not.toThrow();
    });

    it('should continue to other listeners if one fails', () => {
      let secondCalled = false;

      onActionEvent(() => {
        throw new Error('First listener error');
      });

      onActionEvent(() => {
        secondCalled = true;
      });

      emitActionEvent(createTestEvent());

      expect(secondCalled).toBe(true);
    });

    it('should log error when listener fails', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      onActionEvent(() => {
        throw new Error('Test error');
      });

      emitActionEvent(createTestEvent());

      expect(consoleSpy).toHaveBeenCalledWith(
        '[causality] Listener error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
