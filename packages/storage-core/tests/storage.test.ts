/**
 * Tests for Storage implementations
 */

import { InMemoryStorage } from '../src/implementations/memory.js';
import { JSONLStorage } from '../src/implementations/jsonl.js';
import type { CausalityTrace } from '../src/types.js';
import { unlink } from 'fs/promises';

function createTrace(
  traceId: string,
  status: 'ok' | 'error' | 'partial' = 'ok',
  durationMs: number = 100
): CausalityTrace {
  const startTime = Date.now();
  return {
    traceId,
    startTime,
    endTime: startTime + durationMs,
    durationMs,
    status,
    actionCount: 1,
    maxDepth: 0,
    rootActions: [
      {
        id: `action-${traceId}`,
        name: 'TestAction',
        startTime,
        endTime: startTime + durationMs,
        durationMs,
        status: status === 'error' ? 'error' : 'ok',
        depth: 0,
        children: [],
      },
    ],
  };
}

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  describe('save/get', () => {
    it('should save and retrieve a trace', async () => {
      const trace = createTrace('t1');
      await storage.save(trace);

      const retrieved = await storage.get('t1');
      expect(retrieved).toEqual(trace);
    });

    it('should return null for non-existent trace', async () => {
      const result = await storage.get('non-existent');
      expect(result).toBeNull();
    });

    it('should overwrite existing trace', async () => {
      const trace1 = createTrace('t1', 'ok', 100);
      const trace2 = createTrace('t1', 'error', 200);

      await storage.save(trace1);
      await storage.save(trace2);

      const retrieved = await storage.get('t1');
      expect(retrieved?.status).toBe('error');
      expect(retrieved?.durationMs).toBe(200);
    });
  });

  describe('list', () => {
    it('should iterate over all traces', async () => {
      await storage.save(createTrace('t1'));
      await storage.save(createTrace('t2'));
      await storage.save(createTrace('t3'));

      const traces: CausalityTrace[] = [];
      for await (const trace of storage.list()) {
        traces.push(trace);
      }

      expect(traces).toHaveLength(3);
    });
  });

  describe('delete', () => {
    it('should delete a trace', async () => {
      await storage.save(createTrace('t1'));
      expect(await storage.delete('t1')).toBe(true);
      expect(await storage.get('t1')).toBeNull();
    });

    it('should return false for non-existent trace', async () => {
      expect(await storage.delete('non-existent')).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct count', async () => {
      expect(await storage.count()).toBe(0);

      await storage.save(createTrace('t1'));
      await storage.save(createTrace('t2'));

      expect(await storage.count()).toBe(2);
    });
  });

  describe('getMany', () => {
    it('should return multiple traces', async () => {
      await storage.save(createTrace('t1'));
      await storage.save(createTrace('t2'));
      await storage.save(createTrace('t3'));

      const traces = await storage.getMany(['t1', 't3']);
      expect(traces).toHaveLength(2);
    });
  });
});

describe('JSONLStorage', () => {
  const testFile = '/tmp/test-traces.jsonl';
  let storage: JSONLStorage;

  beforeEach(async () => {
    // Clean up test file
    try {
      await unlink(testFile);
    } catch {
      // File might not exist
    }
    storage = new JSONLStorage(testFile);
  });

  afterEach(async () => {
    await storage.close();
    try {
      await unlink(testFile);
    } catch {
      // File might not exist
    }
  });

  describe('save/get', () => {
    it('should save and retrieve a trace', async () => {
      const trace = createTrace('t1');
      await storage.save(trace);

      const retrieved = await storage.get('t1');
      expect(retrieved).toEqual(trace);
    });

    it('should persist traces to file', async () => {
      await storage.save(createTrace('t1'));
      await storage.save(createTrace('t2'));
      await storage.close();

      // Create new storage instance
      const storage2 = new JSONLStorage(testFile);
      await storage2.initialize();

      expect(await storage2.count()).toBe(2);
      expect(await storage2.get('t1')).not.toBeNull();
      expect(await storage2.get('t2')).not.toBeNull();

      await storage2.close();
    });
  });

  describe('list', () => {
    it('should iterate over all traces', async () => {
      await storage.save(createTrace('t1'));
      await storage.save(createTrace('t2'));

      const traces: CausalityTrace[] = [];
      for await (const trace of storage.list()) {
        traces.push(trace);
      }

      expect(traces).toHaveLength(2);
    });
  });

  describe('compact', () => {
    it('should remove deleted entries', async () => {
      await storage.save(createTrace('t1'));
      await storage.save(createTrace('t2'));
      await storage.delete('t1');

      await storage.compact();
      await storage.close();

      // Reload and verify
      const storage2 = new JSONLStorage(testFile);
      await storage2.initialize();

      expect(await storage2.count()).toBe(1);
      expect(await storage2.get('t1')).toBeNull();
      expect(await storage2.get('t2')).not.toBeNull();

      await storage2.close();
    });
  });
});
