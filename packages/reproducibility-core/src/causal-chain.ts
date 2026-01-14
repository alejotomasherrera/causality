/**
 * @causality/reproducibility-core — Causal Chain Builder
 *
 * Reconstructs the ordered causal chain from a trace.
 * Deterministic ordering based on start time and parent relationships.
 */

import type {
  CausalityTrace,
  CausalityActionNode,
  CausalStep,
  ActionMetrics,
  MetricFinding,
  StepMetrics,
} from './types.js';

/**
 * Build an ordered causal chain from a trace.
 * Result is deterministic given the same input.
 */
export function buildCausalChain(
  trace: CausalityTrace,
  metrics: ActionMetrics[],
  findings: MetricFinding[]
): CausalStep[] {
  // Flatten all actions in execution order
  const flatActions = flattenActions(trace.rootActions);

  // Sort by start time (deterministic for same trace)
  flatActions.sort((a, b) => a.startTime - b.startTime);

  // Build metrics lookup
  const metricsMap = new Map<string, ActionMetrics>();
  for (const m of metrics) {
    metricsMap.set(m.actionId, m);
  }

  // Build findings lookup
  const findingsMap = new Map<string, MetricFinding[]>();
  for (const f of findings) {
    const existing = findingsMap.get(f.actionId) ?? [];
    existing.push(f);
    findingsMap.set(f.actionId, existing);
  }

  // Find failure point
  const failureActionId = findFailurePoint(flatActions, findings);

  // Build causal steps
  const steps: CausalStep[] = flatActions.map((action, index) => {
    const actionMetrics = metricsMap.get(action.id);
    const actionFindings = findingsMap.get(action.id) ?? [];

    const stepMetrics: StepMetrics | undefined = actionMetrics
      ? {
          durationMs: actionMetrics.durationMs,
          cpuDelta: actionMetrics.metrics.delta.cpuDelta,
          memoryDeltaMb: actionMetrics.metrics.delta.memoryDeltaMb,
          heapDeltaMb: actionMetrics.metrics.delta.heapDeltaMb,
          eventLoopLagMs: actionMetrics.metrics.end.eventLoopLagMs,
        }
      : undefined;

    const isFailurePoint = action.id === failureActionId;
    const contributesToDegradation = actionFindings.some(
      (f) => f.type === 'silent_degradation' || f.type === 'slow_action'
    );

    return {
      order: index,
      actionId: action.id,
      name: action.name,
      parentId: action.parentId,
      depth: action.depth,
      startTime: action.startTime,
      endTime: action.endTime,
      durationMs: action.durationMs,
      status: action.status,
      attributes: action.attributes,
      metrics: stepMetrics,
      findings: actionFindings,
      isFailurePoint,
      contributesToDegradation,
    };
  });

  return steps;
}

/**
 * Flatten nested actions into a single array.
 */
function flattenActions(nodes: CausalityActionNode[]): CausalityActionNode[] {
  const result: CausalityActionNode[] = [];

  function traverse(node: CausalityActionNode): void {
    result.push(node);
    for (const child of node.children) {
      traverse(child);
    }
  }

  for (const root of nodes) {
    traverse(root);
  }

  return result;
}

/**
 * Find the failure point in the trace.
 * Priority: first error, then first degradation.
 */
function findFailurePoint(
  actions: CausalityActionNode[],
  findings: MetricFinding[]
): string | undefined {
  // First: look for explicit errors
  for (const action of actions) {
    if (action.status === 'error') {
      return action.id;
    }
  }

  // Second: look for degradation findings (by order)
  const degradationFindings = findings
    .filter((f) => f.type === 'silent_degradation' || f.type === 'slow_action')
    .sort((a, b) => {
      // Sort by severity (high first)
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

  if (degradationFindings.length > 0) {
    return degradationFindings[0].actionId;
  }

  return undefined;
}

/**
 * Get the execution path to a specific action (ancestors).
 */
export function getExecutionPath(
  chain: CausalStep[],
  actionId: string
): CausalStep[] {
  const target = chain.find((s) => s.actionId === actionId);
  if (!target) return [];

  const path: CausalStep[] = [];
  let current: CausalStep | undefined = target;

  // Walk up parent chain
  while (current) {
    path.unshift(current);
    current = current.parentId
      ? chain.find((s) => s.actionId === current!.parentId)
      : undefined;
  }

  return path;
}

/**
 * Get parallel actions (actions that overlapped in time).
 */
export function getParallelActions(chain: CausalStep[]): CausalStep[][] {
  const groups: CausalStep[][] = [];
  const used = new Set<string>();

  for (const step of chain) {
    if (used.has(step.actionId)) continue;
    if (!step.endTime) continue;

    const parallel: CausalStep[] = [step];
    used.add(step.actionId);

    for (const other of chain) {
      if (used.has(other.actionId)) continue;
      if (!other.endTime) continue;
      if (other.actionId === step.actionId) continue;

      // Check overlap
      const overlaps =
        step.startTime < other.endTime && step.endTime > other.startTime;

      if (overlaps) {
        parallel.push(other);
        used.add(other.actionId);
      }
    }

    if (parallel.length > 1) {
      groups.push(parallel);
    }
  }

  return groups;
}

/**
 * Calculate max concurrency (peak parallel actions).
 */
export function calculateMaxConcurrency(chain: CausalStep[]): number {
  if (chain.length === 0) return 0;

  // Collect all start/end events
  const events: { time: number; type: 'start' | 'end' }[] = [];

  for (const step of chain) {
    events.push({ time: step.startTime, type: 'start' });
    if (step.endTime) {
      events.push({ time: step.endTime, type: 'end' });
    }
  }

  // Sort by time (starts before ends at same time)
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.type === 'start' ? -1 : 1;
  });

  let current = 0;
  let max = 0;

  for (const event of events) {
    if (event.type === 'start') {
      current++;
      max = Math.max(max, current);
    } else {
      current--;
    }
  }

  return max;
}
