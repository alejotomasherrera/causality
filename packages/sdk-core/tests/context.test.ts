/**
 * Tests for Context Propagation
 */

import { runAction, getCurrentAction, onActionEvent } from '../src/index.js';
import { clearActionEventListeners } from '../src/emitter.js';
import type { ActionEvent } from '../src/index.js';

describe('Context Propagation', () => {
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

  describe('traceId inheritance', () => {
    it('should create new traceId for root action', async () => {
      await runAction('RootAction', async () => {});

      const traceId = events[0].action.traceId;
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
      expect(traceId.length).toBeGreaterThan(0);
    });

    it('should inherit traceId in nested actions', async () => {
      let rootTraceId: string | undefined;
      let nestedTraceId: string | undefined;

      await runAction('RootAction', async () => {
        rootTraceId = getCurrentAction()?.traceId;

        await runAction('NestedAction', async () => {
          nestedTraceId = getCurrentAction()?.traceId;
        });
      });

      expect(rootTraceId).toBeDefined();
      expect(nestedTraceId).toBe(rootTraceId);
    });

    it('should maintain same traceId through deep nesting', async () => {
      const traceIds: string[] = [];

      await runAction('Level1', async () => {
        traceIds.push(getCurrentAction()!.traceId);

        await runAction('Level2', async () => {
          traceIds.push(getCurrentAction()!.traceId);

          await runAction('Level3', async () => {
            traceIds.push(getCurrentAction()!.traceId);
          });
        });
      });

      expect(new Set(traceIds).size).toBe(1);
    });

    it('should create different traceIds for separate root actions', async () => {
      await runAction('Action1', async () => {});
      await runAction('Action2', async () => {});

      const trace1 = events[0].action.traceId;
      const trace2 = events[2].action.traceId;

      expect(trace1).not.toBe(trace2);
    });
  });

  describe('parentId linking', () => {
    it('should not have parentId for root action', async () => {
      await runAction('RootAction', async () => {});

      expect(events[0].action.parentId).toBeUndefined();
    });

    it('should set parentId to parent action id', async () => {
      await runAction('ParentAction', async () => {
        await runAction('ChildAction', async () => {});
      });

      const parentStart = events[0];
      const childStart = events[1];

      expect(childStart.action.parentId).toBe(parentStart.action.id);
    });

    it('should correctly chain parentIds in deep nesting', async () => {
      await runAction('Level1', async () => {
        await runAction('Level2', async () => {
          await runAction('Level3', async () => {});
        });
      });

      const level1 = events.find((e) => e.action.name === 'Level1' && e.type === 'action.start');
      const level2 = events.find((e) => e.action.name === 'Level2' && e.type === 'action.start');
      const level3 = events.find((e) => e.action.name === 'Level3' && e.type === 'action.start');

      expect(level1?.action.parentId).toBeUndefined();
      expect(level2?.action.parentId).toBe(level1?.action.id);
      expect(level3?.action.parentId).toBe(level2?.action.id);
    });
  });

  describe('getCurrentAction', () => {
    it('should return undefined outside of action', () => {
      expect(getCurrentAction()).toBeUndefined();
    });

    it('should return current context inside action', async () => {
      let context: { traceId: string; actionId: string } | undefined;

      await runAction('TestAction', async () => {
        context = getCurrentAction();
      });

      expect(context).toBeDefined();
      expect(context?.traceId).toBe(events[0].action.traceId);
      expect(context?.actionId).toBe(events[0].action.id);
    });

    it('should return innermost action in nested context', async () => {
      const contexts: Array<{ traceId: string; actionId: string } | undefined> = [];

      await runAction('Outer', async () => {
        contexts.push(getCurrentAction());

        await runAction('Inner', async () => {
          contexts.push(getCurrentAction());
        });

        contexts.push(getCurrentAction());
      });

      const outerStart = events.find((e) => e.action.name === 'Outer' && e.type === 'action.start');
      const innerStart = events.find((e) => e.action.name === 'Inner' && e.type === 'action.start');

      expect(contexts[0]?.actionId).toBe(outerStart?.action.id);
      expect(contexts[1]?.actionId).toBe(innerStart?.action.id);
      expect(contexts[2]?.actionId).toBe(outerStart?.action.id);
    });
  });

  describe('async propagation', () => {
    it('should maintain context across async operations', async () => {
      let midContext: { traceId: string; actionId: string } | undefined;

      await runAction('AsyncAction', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        midContext = getCurrentAction();
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(midContext).toBeDefined();
      expect(midContext?.traceId).toBe(events[0].action.traceId);
    });

    it('should handle concurrent nested actions correctly', async () => {
      await runAction('Parent', async () => {
        await Promise.all([
          runAction('Child1', async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
          }),
          runAction('Child2', async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
          }),
        ]);
      });

      const parentStart = events.find((e) => e.action.name === 'Parent' && e.type === 'action.start');
      const child1Start = events.find((e) => e.action.name === 'Child1' && e.type === 'action.start');
      const child2Start = events.find((e) => e.action.name === 'Child2' && e.type === 'action.start');

      // Both children should have same parent
      expect(child1Start?.action.parentId).toBe(parentStart?.action.id);
      expect(child2Start?.action.parentId).toBe(parentStart?.action.id);

      // All should share same traceId
      expect(child1Start?.action.traceId).toBe(parentStart?.action.traceId);
      expect(child2Start?.action.traceId).toBe(parentStart?.action.traceId);
    });
  });
});
