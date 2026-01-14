/**
 * Tests for TraceRepository
 */

import { InMemoryStorage } from '../src/implementations/memory.js';
import { TraceRepository } from '../src/repository.js';
import type { CausalityTrace, CausalityActionNode } from '../src/types.js';

function createAction(
  name: string,
  status: 'ok' | 'error' | 'incomplete' = 'ok',
  durationMs: number = 100,
  children: CausalityActionNode[] = []
): CausalityActionNode {
  const startTime = Date.now();
  return {
    id: `action-${name}-${Math.random().toString(36).slice(2)}`,
    name,
    startTime,
    endTime: startTime + durationMs,
    durationMs,
    status,
    depth: 0,
    children,
  };
}

function createTrace(
  traceId: string,
  status: 'ok' | 'error' | 'partial',
  durationMs: number,
  actions: CausalityActionNode[],
  startTime: number = Date.now()
): CausalityTrace {
  return {
    traceId,
    startTime,
    endTime: startTime + durationMs,
    durationMs,
    status,
    actionCount: actions.length,
    maxDepth: 0,
    rootActions: actions,
  };
}

describe('TraceRepository', () => {
  let storage: InMemoryStorage;
  let repo: TraceRepository;

  beforeEach(() => {
    storage = new InMemoryStorage();
    repo = new TraceRepository(storage);
  });

  describe('query', () => {
    beforeEach(async () => {
      const now = Date.now();

      await storage.save(
        createTrace('t1', 'ok', 100, [createAction('CreateOrder')], now - 5000)
      );
      await storage.save(
        createTrace('t2', 'error', 500, [createAction('ProcessPayment', 'error', 500)], now - 4000)
      );
      await storage.save(
        createTrace('t3', 'ok', 200, [createAction('ValidateUser')], now - 3000)
      );
      await storage.save(
        createTrace('t4', 'partial', 300, [createAction('CreateOrder', 'incomplete')], now - 2000)
      );
      await storage.save(
        createTrace('t5', 'error', 1000, [
          createAction('CreateOrder'),
          createAction('ProcessPayment', 'error', 800),
        ], now - 1000)
      );
    });

    it('should query by traceId', async () => {
      const results = await repo.query({ traceId: 't2' });
      expect(results).toHaveLength(1);
      expect(results[0].traceId).toBe('t2');
    });

    it('should query by status', async () => {
      const results = await repo.query({ status: 'error' });
      expect(results).toHaveLength(2);
    });

    it('should query by actionName', async () => {
      const results = await repo.query({ actionName: 'CreateOrder' });
      expect(results).toHaveLength(3);
    });

    it('should query by minDurationMs', async () => {
      const results = await repo.query({ minDurationMs: 400 });
      expect(results).toHaveLength(2);
    });

    it('should query by maxDurationMs', async () => {
      const results = await repo.query({ maxDurationMs: 250 });
      expect(results).toHaveLength(2);
    });

    it('should combine multiple filters', async () => {
      const results = await repo.query({
        status: 'error',
        actionName: 'ProcessPayment',
        minDurationMs: 400,
      });
      expect(results).toHaveLength(2);
    });

    it('should sort by startTime', async () => {
      const results = await repo.query({
        orderBy: 'startTime',
        order: 'asc',
      });

      expect(results).toHaveLength(5);
      expect(results[0].traceId).toBe('t1');
      expect(results[4].traceId).toBe('t5');
    });

    it('should sort by duration desc', async () => {
      const results = await repo.query({
        orderBy: 'duration',
        order: 'desc',
      });

      expect(results[0].durationMs).toBe(1000);
    });

    it('should limit results', async () => {
      const results = await repo.query({ limit: 2 });
      expect(results).toHaveLength(2);
    });
  });

  describe('queryWithActions', () => {
    beforeEach(async () => {
      await storage.save(
        createTrace('t1', 'ok', 600, [
          createAction('CreateOrder'),
          createAction('ProcessPayment', 'ok', 500),
        ])
      );
      await storage.save(
        createTrace('t2', 'error', 400, [
          createAction('CreateOrder'),
          createAction('ProcessPayment', 'error', 300),
        ])
      );
      await storage.save(
        createTrace('t3', 'ok', 200, [
          createAction('CreateOrder'),
          createAction('ProcessPayment', 'ok', 100),
        ])
      );
    });

    it('should filter by action duration', async () => {
      const results = await repo.queryWithActions({
        actionFilter: {
          name: 'ProcessPayment',
          minDurationMs: 400,
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0].traceId).toBe('t1');
    });

    it('should filter by action status', async () => {
      const results = await repo.queryWithActions({
        actionFilter: {
          name: 'ProcessPayment',
          status: 'error',
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0].traceId).toBe('t2');
    });

    it('should combine trace and action filters', async () => {
      const results = await repo.queryWithActions({
        status: 'error',
        actionFilter: {
          name: 'ProcessPayment',
          minDurationMs: 200,
        },
      });

      expect(results).toHaveLength(1);
    });
  });

  describe('findByAction', () => {
    it('should find traces containing action', async () => {
      await storage.save(
        createTrace('t1', 'ok', 100, [createAction('CreateOrder')])
      );
      await storage.save(
        createTrace('t2', 'ok', 100, [createAction('ProcessPayment')])
      );

      const results = await repo.findByAction('CreateOrder');
      expect(results).toHaveLength(1);
    });
  });

  describe('findFailed', () => {
    it('should find failed traces', async () => {
      await storage.save(createTrace('t1', 'ok', 100, [createAction('A')]));
      await storage.save(createTrace('t2', 'error', 100, [createAction('A')]));
      await storage.save(createTrace('t3', 'error', 100, [createAction('A')]));

      const results = await repo.findFailed();
      expect(results).toHaveLength(2);
    });
  });

  describe('findSlow', () => {
    it('should find slow traces', async () => {
      await storage.save(createTrace('t1', 'ok', 100, [createAction('A')]));
      await storage.save(createTrace('t2', 'ok', 500, [createAction('A')]));
      await storage.save(createTrace('t3', 'ok', 1000, [createAction('A')]));

      const results = await repo.findSlow(400);
      expect(results).toHaveLength(2);
    });
  });

  describe('complex query: failed ProcessPayment > 500ms', () => {
    it('should answer the Phase 3A success criterion', async () => {
      const now = Date.now();

      // Create test data
      await storage.save(
        createTrace('t1', 'ok', 600, [
          createAction('CreateOrder'),
          createAction('ProcessPayment', 'ok', 550),
        ], now - 30000)
      );

      await storage.save(
        createTrace('t2', 'error', 800, [
          createAction('CreateOrder'),
          createAction('ProcessPayment', 'error', 700),
        ], now - 20000)
      );

      await storage.save(
        createTrace('t3', 'error', 300, [
          createAction('CreateOrder'),
          createAction('ProcessPayment', 'error', 200),
        ], now - 10000)
      );

      await storage.save(
        createTrace('t4', 'error', 900, [
          createAction('CreateOrder'),
          createAction('ProcessPayment', 'error', 800),
        ], now - 5000)
      );

      // Query: failed traces in last minute where ProcessPayment > 500ms
      const results = await repo.queryWithActions({
        status: 'error',
        from: now - 60000,
        to: now,
        actionFilter: {
          name: 'ProcessPayment',
          minDurationMs: 500,
        },
      });

      expect(results).toHaveLength(2);
      expect(results.map((t) => t.traceId).sort()).toEqual(['t2', 't4']);
    });
  });
});
