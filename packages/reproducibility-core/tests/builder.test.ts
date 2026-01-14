/**
 * Tests for Explanation Builder
 */

import { buildExplanation, ExplanationBuilder } from '../src/builder.js';
import type { CausalityTrace, CausalityActionNode, ActionMetrics, MetricFinding } from '../src/types.js';

function createAction(
  id: string,
  name: string,
  depth: number,
  startTime: number,
  durationMs: number = 100,
  status: 'ok' | 'error' | 'incomplete' = 'ok',
  parentId?: string,
  children: CausalityActionNode[] = [],
  attributes?: Record<string, unknown>
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
    attributes,
  };
}

function createTrace(
  traceId: string,
  rootActions: CausalityActionNode[],
  status: 'ok' | 'error' | 'partial' = 'ok'
): CausalityTrace {
  const allActions: CausalityActionNode[] = [];
  function traverse(node: CausalityActionNode) {
    allActions.push(node);
    node.children.forEach(traverse);
  }
  rootActions.forEach(traverse);

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

function createMetrics(actionId: string, traceId: string, durationMs: number = 100): ActionMetrics {
  return {
    actionId,
    traceId,
    name: 'Action',
    startTime: 1000,
    endTime: 1000 + durationMs,
    durationMs,
    status: 'ok',
    metrics: {
      start: { timestamp: 1000, cpuUsage: 10, memoryRssMb: 100, heapUsedMb: 50 },
      end: { timestamp: 1000 + durationMs, cpuUsage: 20, memoryRssMb: 120, heapUsedMb: 60 },
      delta: { durationMs, cpuDelta: 10, memoryDeltaMb: 20, heapDeltaMb: 10 },
    },
  };
}

function createFinding(
  actionId: string,
  type: string = 'slow_action',
  severity: 'low' | 'medium' | 'high' = 'medium'
): MetricFinding {
  return {
    type: type as any,
    severity,
    traceId: 't1',
    actionId,
    actionName: 'Action',
    message: 'Test finding',
    details: { durationMs: 500 },
    metrics: {} as any,
  };
}

describe('buildExplanation', () => {
  it('should build a complete explanation', () => {
    const child = createAction('c1', 'ProcessPayment', 1, 1010, 500, 'ok', 'r1');
    const root = createAction('r1', 'CreateOrder', 0, 1000, 600, 'ok', undefined, [child]);
    const trace = createTrace('t1', [root]);

    const metrics = [
      createMetrics('r1', 't1', 600),
      createMetrics('c1', 't1', 500),
    ];

    const findings = [
      createFinding('c1', 'slow_action', 'medium'),
    ];

    const explanation = buildExplanation({ trace, metrics, findings });

    expect(explanation.id).toBeDefined();
    expect(explanation.traceId).toBe('t1');
    expect(explanation.causalChain).toHaveLength(2);
    expect(explanation.findings).toHaveLength(1);
  });

  it('should classify error issue type', () => {
    const child = createAction('c1', 'FailingAction', 1, 1010, 50, 'error', 'r1');
    const root = createAction('r1', 'Root', 0, 1000, 100, 'ok', undefined, [child]);
    const trace = createTrace('t1', [root], 'error');

    const explanation = buildExplanation({ trace, metrics: [], findings: [] });

    expect(explanation.issueType).toBe('explicit_error');
    expect(explanation.failurePoint).toBeDefined();
    expect(explanation.failurePoint?.name).toBe('FailingAction');
  });

  it('should classify silent degradation', () => {
    const root = createAction('r1', 'SlowAction', 0, 1000, 1000);
    const trace = createTrace('t1', [root]);

    const findings = [createFinding('r1', 'silent_degradation', 'high')];

    const explanation = buildExplanation({ trace, metrics: [], findings });

    expect(explanation.issueType).toBe('silent_degradation');
  });

  it('should extract reproducibility conditions', () => {
    const root = createAction('r1', 'CreateOrder', 0, 1000, 100, 'ok', undefined, [], {
      userId: 'u123',
      amount: 100,
    });
    const trace = createTrace('t1', [root]);

    const explanation = buildExplanation({ trace, metrics: [], findings: [] });

    expect(explanation.conditions.requiredInputs.length).toBeGreaterThan(0);
  });

  it('should generate replay instructions', () => {
    const child = createAction('c1', 'ProcessPayment', 1, 1010, 500, 'ok', 'r1');
    const root = createAction('r1', 'CreateOrder', 0, 1000, 600, 'ok', undefined, [child]);
    const trace = createTrace('t1', [root]);

    const findings = [createFinding('c1', 'slow_action', 'medium')];

    const explanation = buildExplanation({ trace, metrics: [], findings });

    expect(explanation.replayInstructions.length).toBeGreaterThan(0);
    expect(explanation.replayInstructions.some(i => i.type === 'execute')).toBe(true);
  });

  it('should be deterministic for same input', () => {
    const root = createAction('r1', 'Root', 0, 1000, 100);
    const trace = createTrace('t1', [root]);
    const findings = [createFinding('r1', 'slow_action', 'medium')];

    const explanation1 = buildExplanation({ trace, metrics: [], findings });
    const explanation2 = buildExplanation({ trace, metrics: [], findings });

    expect(explanation1.id).toBe(explanation2.id);
    expect(explanation1.issueType).toBe(explanation2.issueType);
    expect(explanation1.severity).toBe(explanation2.severity);
    expect(explanation1.causalChain.length).toBe(explanation2.causalChain.length);
    expect(explanation1.causalChain.map(s => s.actionId))
      .toEqual(explanation2.causalChain.map(s => s.actionId));
  });
});

describe('ExplanationBuilder', () => {
  it('should create builder with config', () => {
    const builder = new ExplanationBuilder({
      cpuPressureThreshold: 30,
      memoryPressureThreshold: 100,
    });

    const root = createAction('r1', 'Root', 0, 1000, 100);
    const trace = createTrace('t1', [root]);

    const explanation = builder.build({ trace, metrics: [], findings: [] });

    expect(explanation).toBeDefined();
  });

  it('should get patterns from explanation', () => {
    const builder = new ExplanationBuilder();

    const root = createAction('r1', 'Root', 0, 1000, 100, 'ok', undefined, [], {
      userId: 'u123',
    });
    const trace = createTrace('t1', [root]);

    const explanation = builder.build({ trace, metrics: [], findings: [] });
    const patterns = builder.getPatterns(explanation);

    expect(patterns.some(p => p.includes('inputs'))).toBe(true);
  });

  it('should get contributing steps', () => {
    const builder = new ExplanationBuilder();

    const child = createAction('c1', 'FailingAction', 1, 1010, 50, 'error', 'r1');
    const root = createAction('r1', 'Root', 0, 1000, 100, 'ok', undefined, [child]);
    const trace = createTrace('t1', [root], 'error');

    const explanation = builder.build({ trace, metrics: [], findings: [] });
    const contributing = builder.getContributingSteps(explanation);

    expect(contributing.some(s => s.name === 'FailingAction')).toBe(true);
  });

  it('should get failure path', () => {
    const builder = new ExplanationBuilder();

    const grandchild = createAction('gc1', 'DeepError', 2, 1020, 30, 'error', 'c1');
    const child = createAction('c1', 'Child', 1, 1010, 50, 'ok', 'r1', [grandchild]);
    const root = createAction('r1', 'Root', 0, 1000, 100, 'ok', undefined, [child]);
    const trace = createTrace('t1', [root], 'error');

    const explanation = builder.build({ trace, metrics: [], findings: [] });
    const path = builder.getFailurePath(explanation);

    expect(path.map(s => s.name)).toEqual(['Root', 'Child', 'DeepError']);
  });
});

describe('Success Criterion: Degrading Trace → Reproducible Explanation', () => {
  it('should produce explanation that allows reproduction', () => {
    // Simulate a successful-but-degrading production trace
    const validateUser = createAction('v1', 'ValidateUser', 1, 1010, 50, 'ok', 'r1');
    const processPayment = createAction('p1', 'ProcessPayment', 1, 1060, 800, 'ok', 'r1', [], {
      paymentMethod: 'credit_card',
      amount: 99.99,
    });
    const sendConfirmation = createAction('s1', 'SendConfirmation', 1, 1860, 30, 'ok', 'r1');

    const createOrder = createAction('r1', 'CreateOrder', 0, 1000, 900, 'ok', undefined,
      [validateUser, processPayment, sendConfirmation],
      { userId: 'u-12345', orderId: 'ord-999' }
    );

    const trace = createTrace('trace-prod-001', [createOrder]);

    const metrics: ActionMetrics[] = [
      {
        actionId: 'p1',
        traceId: 'trace-prod-001',
        name: 'ProcessPayment',
        startTime: 1060,
        endTime: 1860,
        durationMs: 800,
        status: 'ok',
        metrics: {
          start: { timestamp: 1060, cpuUsage: 15, memoryRssMb: 200, heapUsedMb: 100 },
          end: { timestamp: 1860, cpuUsage: 55, memoryRssMb: 280, heapUsedMb: 140 },
          delta: { durationMs: 800, cpuDelta: 40, memoryDeltaMb: 80, heapDeltaMb: 40 },
        },
      },
    ];

    const findings: MetricFinding[] = [
      {
        type: 'silent_degradation',
        severity: 'high',
        traceId: 'trace-prod-001',
        actionId: 'p1',
        actionName: 'ProcessPayment',
        message: 'Action "ProcessPayment" succeeded but degraded UX: slow (800ms > 500ms), high CPU (40%)',
        details: {
          issues: ['slow (800ms > 500ms)', 'high CPU (40%)'],
          durationMs: 800,
          cpuDelta: 40,
          memoryDeltaMb: 80,
        },
        metrics: metrics[0],
      },
    ];

    // Build explanation
    const explanation = buildExplanation({ trace, metrics, findings });

    // Verify the explanation enables reproduction
    expect(explanation.issueType).toBe('silent_degradation');
    expect(explanation.severity).toBe('high');
    expect(explanation.summary).toContain('ProcessPayment');

    // Should identify the failure point
    expect(explanation.failurePoint).toBeDefined();
    expect(explanation.failurePoint?.name).toBe('ProcessPayment');

    // Should extract required inputs
    const inputNames = explanation.conditions.requiredInputs.map(i => i.name);
    expect(inputNames).toContain('userId');
    expect(inputNames).toContain('paymentMethod');
    expect(inputNames).toContain('amount');

    // Should detect resource pressure
    expect(explanation.conditions.resourcePressure.cpuPressure).toBe(true);
    expect(explanation.conditions.resourcePressure.memoryPressure).toBe(true);

    // Should have replay instructions
    expect(explanation.replayInstructions.length).toBeGreaterThan(0);

    // Should have causal ordering
    const stepNames = explanation.causalChain.map(s => s.name);
    expect(stepNames).toContain('CreateOrder');
    expect(stepNames).toContain('ProcessPayment');

    // Everything is deterministic
    const explanation2 = buildExplanation({ trace, metrics, findings });
    expect(explanation.causalChain.map(s => s.actionId))
      .toEqual(explanation2.causalChain.map(s => s.actionId));
  });
});
