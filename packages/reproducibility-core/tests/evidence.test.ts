/**
 * Tests for Evidence Attribution
 */

import {
  calculateAggregateMetrics,
  getImpactfulFindings,
  getContributingSteps,
  summarizeEvidence,
  getPeakResourceStep,
} from '../src/evidence.js';
import type { CausalStep, MetricFinding } from '../src/types.js';

function createStep(
  overrides: Partial<{
    actionId: string;
    name: string;
    status: 'ok' | 'error' | 'incomplete';
    durationMs: number;
    cpuDelta: number;
    memoryDeltaMb: number;
    isFailurePoint: boolean;
    contributesToDegradation: boolean;
    findings: MetricFinding[];
  }> = {}
): CausalStep {
  return {
    order: 0,
    actionId: overrides.actionId ?? 'a1',
    name: overrides.name ?? 'Action',
    depth: 0,
    startTime: 1000,
    endTime: 1000 + (overrides.durationMs ?? 100),
    durationMs: overrides.durationMs ?? 100,
    status: overrides.status ?? 'ok',
    metrics: {
      durationMs: overrides.durationMs ?? 100,
      cpuDelta: overrides.cpuDelta ?? 10,
      memoryDeltaMb: overrides.memoryDeltaMb ?? 20,
      heapDeltaMb: 10,
    },
    findings: overrides.findings ?? [],
    isFailurePoint: overrides.isFailurePoint ?? false,
    contributesToDegradation: overrides.contributesToDegradation ?? false,
  };
}

function createFinding(
  type: string,
  severity: 'low' | 'medium' | 'high',
  actionId: string = 'a1'
): MetricFinding {
  return {
    type: type as any,
    severity,
    traceId: 't1',
    actionId,
    actionName: 'Action',
    message: 'Test finding',
    details: { durationMs: 500, cpuDelta: 30, memoryDeltaMb: 60 },
    metrics: {} as any,
  };
}

describe('calculateAggregateMetrics', () => {
  it('should aggregate metrics from steps', () => {
    const steps = [
      createStep({ durationMs: 100, cpuDelta: 10, memoryDeltaMb: 20 }),
      createStep({ durationMs: 200, cpuDelta: 30, memoryDeltaMb: 40 }),
    ];

    const aggregate = calculateAggregateMetrics(steps, []);

    expect(aggregate.totalDurationMs).toBe(300);
    expect(aggregate.totalCpuDelta).toBe(40);
    expect(aggregate.totalMemoryDeltaMb).toBe(60);
    expect(aggregate.maxCpuDelta).toBe(30);
    expect(aggregate.maxMemoryDeltaMb).toBe(40);
    expect(aggregate.actionCount).toBe(2);
  });

  it('should count errors and degraded actions', () => {
    const steps = [
      createStep({ status: 'error' }),
      createStep({ contributesToDegradation: true }),
      createStep(),
    ];

    const aggregate = calculateAggregateMetrics(steps, []);

    expect(aggregate.errorCount).toBe(1);
    expect(aggregate.degradedActionCount).toBe(1);
  });
});

describe('getImpactfulFindings', () => {
  it('should sort by severity', () => {
    const findings = [
      createFinding('slow_action', 'low'),
      createFinding('slow_action', 'high'),
      createFinding('slow_action', 'medium'),
    ];

    const impactful = getImpactfulFindings(findings);

    expect(impactful[0].severity).toBe('high');
    expect(impactful[1].severity).toBe('medium');
    expect(impactful[2].severity).toBe('low');
  });

  it('should prioritize silent_degradation type', () => {
    const findings = [
      createFinding('slow_action', 'high'),
      createFinding('silent_degradation', 'high'),
    ];

    const impactful = getImpactfulFindings(findings);

    expect(impactful[0].type).toBe('silent_degradation');
  });

  it('should respect limit', () => {
    const findings = [
      createFinding('slow_action', 'high'),
      createFinding('slow_action', 'high'),
      createFinding('slow_action', 'high'),
    ];

    const impactful = getImpactfulFindings(findings, 2);

    expect(impactful).toHaveLength(2);
  });
});

describe('getContributingSteps', () => {
  it('should return steps with errors or findings', () => {
    const steps = [
      createStep({ status: 'error' }),
      createStep({ contributesToDegradation: true }),
      createStep({ isFailurePoint: true }),
      createStep(),
    ];

    const contributing = getContributingSteps(steps);

    expect(contributing).toHaveLength(3);
  });
});

describe('summarizeEvidence', () => {
  it('should summarize errors', () => {
    const steps = [createStep({ name: 'Failing', status: 'error' })];
    const summary = summarizeEvidence(steps, []);

    expect(summary).toContain('1 action(s) failed: Failing');
  });

  it('should summarize slow actions', () => {
    const findings = [createFinding('slow_action', 'high')];
    const summary = summarizeEvidence([], findings);

    expect(summary.some(s => s.includes('slow action'))).toBe(true);
  });
});

describe('getPeakResourceStep', () => {
  it('should find peak CPU step', () => {
    const steps = [
      createStep({ actionId: 'a1', cpuDelta: 10 }),
      createStep({ actionId: 'a2', cpuDelta: 50 }),
      createStep({ actionId: 'a3', cpuDelta: 30 }),
    ];

    const peak = getPeakResourceStep(steps, 'cpu');

    expect(peak?.actionId).toBe('a2');
  });

  it('should find peak duration step', () => {
    const steps = [
      createStep({ actionId: 'a1', durationMs: 100 }),
      createStep({ actionId: 'a2', durationMs: 500 }),
    ];

    const peak = getPeakResourceStep(steps, 'duration');

    expect(peak?.actionId).toBe('a2');
  });
});
