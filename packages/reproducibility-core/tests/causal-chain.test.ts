/**
 * Tests for Causal Chain Builder
 */

import { buildCausalChain, getExecutionPath, getParallelActions, calculateMaxConcurrency } from '../src/causal-chain.js';
import type { CausalityTrace, CausalityActionNode, ActionMetrics, MetricFinding } from '../src/types.js';

function createAction(
  id: string,
  name: string,
  depth: number,
  startTime: number,
  durationMs: number = 100,
  status: 'ok' | 'error' | 'incomplete' = 'ok',
  parentId?: string,
  children: CausalityActionNode[] = []
): CausalityActionNode {
  return {
    id,
    name,
    depth,
    parentId,
    startTime,
    endTime: startTime + durationMs,
    durationMs,
    status,
    children,
  };
}

function createTrace(
  traceId: string,
  rootActions: CausalityActionNode[],
  status: 'ok' | 'error' | 'partial' = 'ok'
): CausalityTrace {
  const allActions = flattenAll(rootActions);
  const startTime = Math.min(...allActions.map(a => a.startTime));
  const endTime = Math.max(...allActions.map(a => a.endTime ?? a.startTime));

  return {
    traceId,
    startTime,
    endTime,
    durationMs: endTime - startTime,
    status,
    actionCount: allActions.length,
    maxDepth: Math.max(...allActions.map(a => a.depth)),
    rootActions,
  };
}

function flattenAll(nodes: CausalityActionNode[]): CausalityActionNode[] {
  const result: CausalityActionNode[] = [];
  function traverse(node: CausalityActionNode) {
    result.push(node);
    node.children.forEach(traverse);
  }
  nodes.forEach(traverse);
  return result;
}

describe('buildCausalChain', () => {
  it('should produce ordered steps by start time', () => {
    const child1 = createAction('c1', 'Child1', 1, 1010, 50, 'ok', 'r1');
    const child2 = createAction('c2', 'Child2', 1, 1070, 50, 'ok', 'r1');
    const root = createAction('r1', 'Root', 0, 1000, 200, 'ok', undefined, [child1, child2]);
    const trace = createTrace('t1', [root]);

    const chain = buildCausalChain(trace, [], []);

    expect(chain).toHaveLength(3);
    expect(chain[0].name).toBe('Root');
    expect(chain[1].name).toBe('Child1');
    expect(chain[2].name).toBe('Child2');
  });

  it('should mark failure point for error', () => {
    const child = createAction('c1', 'FailingAction', 1, 1010, 50, 'error', 'r1');
    const root = createAction('r1', 'Root', 0, 1000, 100, 'ok', undefined, [child]);
    const trace = createTrace('t1', [root], 'error');

    const chain = buildCausalChain(trace, [], []);

    const failureStep = chain.find(s => s.isFailurePoint);
    expect(failureStep).toBeDefined();
    expect(failureStep?.name).toBe('FailingAction');
  });

  it('should include metrics when provided', () => {
    const root = createAction('r1', 'Root', 0, 1000, 100);
    const trace = createTrace('t1', [root]);

    const metrics: ActionMetrics[] = [{
      actionId: 'r1',
      traceId: 't1',
      name: 'Root',
      startTime: 1000,
      endTime: 1100,
      durationMs: 100,
      status: 'ok',
      metrics: {
        start: { timestamp: 1000, cpuUsage: 10, memoryRssMb: 100, heapUsedMb: 50 },
        end: { timestamp: 1100, cpuUsage: 25, memoryRssMb: 150, heapUsedMb: 75 },
        delta: { durationMs: 100, cpuDelta: 15, memoryDeltaMb: 50, heapDeltaMb: 25 },
      },
    }];

    const chain = buildCausalChain(trace, metrics, []);

    expect(chain[0].metrics).toBeDefined();
    expect(chain[0].metrics?.cpuDelta).toBe(15);
    expect(chain[0].metrics?.memoryDeltaMb).toBe(50);
  });

  it('should associate findings with steps', () => {
    const root = createAction('r1', 'Root', 0, 1000, 100);
    const trace = createTrace('t1', [root]);

    const findings: MetricFinding[] = [{
      type: 'slow_action',
      severity: 'medium',
      traceId: 't1',
      actionId: 'r1',
      actionName: 'Root',
      message: 'Slow',
      details: {},
      metrics: {} as any,
    }];

    const chain = buildCausalChain(trace, [], findings);

    expect(chain[0].findings).toHaveLength(1);
    expect(chain[0].findings[0].type).toBe('slow_action');
  });

  it('should mark degradation contributor', () => {
    const root = createAction('r1', 'Root', 0, 1000, 100);
    const trace = createTrace('t1', [root]);

    const findings: MetricFinding[] = [{
      type: 'silent_degradation',
      severity: 'high',
      traceId: 't1',
      actionId: 'r1',
      actionName: 'Root',
      message: 'Silent degradation',
      details: {},
      metrics: {} as any,
    }];

    const chain = buildCausalChain(trace, [], findings);

    expect(chain[0].contributesToDegradation).toBe(true);
  });

  it('should be deterministic for same input', () => {
    const child1 = createAction('c1', 'A', 1, 1020, 50, 'ok', 'r1');
    const child2 = createAction('c2', 'B', 1, 1010, 50, 'ok', 'r1');
    const root = createAction('r1', 'Root', 0, 1000, 200, 'ok', undefined, [child1, child2]);
    const trace = createTrace('t1', [root]);

    const chain1 = buildCausalChain(trace, [], []);
    const chain2 = buildCausalChain(trace, [], []);

    expect(chain1.map(s => s.actionId)).toEqual(chain2.map(s => s.actionId));
    expect(chain1.map(s => s.order)).toEqual(chain2.map(s => s.order));
  });
});

describe('getExecutionPath', () => {
  it('should return path to action', () => {
    const grandchild = createAction('gc1', 'GrandChild', 2, 1020, 30, 'ok', 'c1');
    const child = createAction('c1', 'Child', 1, 1010, 50, 'ok', 'r1', [grandchild]);
    const root = createAction('r1', 'Root', 0, 1000, 100, 'ok', undefined, [child]);
    const trace = createTrace('t1', [root]);

    const chain = buildCausalChain(trace, [], []);
    const path = getExecutionPath(chain, 'gc1');

    expect(path).toHaveLength(3);
    expect(path.map(s => s.name)).toEqual(['Root', 'Child', 'GrandChild']);
  });
});

describe('getParallelActions', () => {
  it('should identify parallel actions', () => {
    const a1 = createAction('a1', 'A', 0, 1000, 100);
    const a2 = createAction('a2', 'B', 0, 1050, 100); // overlaps with a1
    const trace = createTrace('t1', [a1, a2]);

    const chain = buildCausalChain(trace, [], []);
    const parallel = getParallelActions(chain);

    expect(parallel).toHaveLength(1);
    expect(parallel[0]).toHaveLength(2);
  });
});

describe('calculateMaxConcurrency', () => {
  it('should calculate max concurrent actions', () => {
    const a1 = createAction('a1', 'A', 0, 1000, 100);
    const a2 = createAction('a2', 'B', 0, 1050, 100);
    const a3 = createAction('a3', 'C', 0, 1070, 50);
    const trace = createTrace('t1', [a1, a2, a3]);

    const chain = buildCausalChain(trace, [], []);
    const max = calculateMaxConcurrency(chain);

    expect(max).toBe(3); // All three overlap at some point
  });

  it('should return 1 for sequential actions', () => {
    const a1 = createAction('a1', 'A', 0, 1000, 50);
    const a2 = createAction('a2', 'B', 0, 1100, 50);
    const trace = createTrace('t1', [a1, a2]);

    const chain = buildCausalChain(trace, [], []);
    const max = calculateMaxConcurrency(chain);

    expect(max).toBe(1);
  });
});
