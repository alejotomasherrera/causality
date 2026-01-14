/**
 * Tests for Reporters
 */

import {
  generateReport,
  formatFinding,
  formatReportText,
  groupByTrace,
  groupByAction,
  filterBySeverity,
  sortBySeverity,
  InMemoryReporter,
} from '../src/reporters.js';
import type { MetricFinding, ActionMetrics } from '../src/types.js';

function createFinding(
  overrides: Partial<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    traceId: string;
    actionName: string;
  }> = {}
): MetricFinding {
  const mockMetrics: ActionMetrics = {
    actionId: 'action-1',
    traceId: overrides.traceId ?? 'trace-1',
    name: overrides.actionName ?? 'TestAction',
    startTime: Date.now() - 100,
    endTime: Date.now(),
    durationMs: 100,
    status: 'ok',
    metrics: {
      start: { timestamp: 0, cpuUsage: 0, memoryRssMb: 0, heapUsedMb: 0 },
      end: { timestamp: 0, cpuUsage: 0, memoryRssMb: 0, heapUsedMb: 0 },
      delta: { durationMs: 0, cpuDelta: 0, memoryDeltaMb: 0, heapDeltaMb: 0 },
    },
  };

  return {
    type: (overrides.type ?? 'slow_action') as any,
    severity: overrides.severity ?? 'low',
    traceId: overrides.traceId ?? 'trace-1',
    actionId: 'action-1',
    actionName: overrides.actionName ?? 'TestAction',
    message: 'Test finding message',
    details: {},
    metrics: mockMetrics,
  };
}

describe('generateReport', () => {
  it('should generate a report with summary', () => {
    const findings = [
      createFinding({ severity: 'high' }),
      createFinding({ severity: 'medium' }),
      createFinding({ severity: 'low' }),
    ];

    const report = generateReport(findings);

    expect(report.summary.total).toBe(3);
    expect(report.summary.bySeverity.high).toBe(1);
    expect(report.summary.bySeverity.medium).toBe(1);
    expect(report.summary.bySeverity.low).toBe(1);
  });

  it('should count by type', () => {
    const findings = [
      createFinding({ type: 'slow_action' }),
      createFinding({ type: 'slow_action' }),
      createFinding({ type: 'high_cpu' }),
    ];

    const report = generateReport(findings);

    expect(report.summary.byType['slow_action']).toBe(2);
    expect(report.summary.byType['high_cpu']).toBe(1);
  });
});

describe('formatFinding', () => {
  it('should format finding as string', () => {
    const finding = createFinding({ severity: 'high', type: 'slow_action' });
    const formatted = formatFinding(finding);

    expect(formatted).toContain('[HIGH]');
    expect(formatted).toContain('slow_action');
  });
});

describe('formatReportText', () => {
  it('should format report as text', () => {
    const findings = [createFinding()];
    const report = generateReport(findings);
    const text = formatReportText(report);

    expect(text).toContain('=== Metrics Findings Report ===');
    expect(text).toContain('Total findings: 1');
  });
});

describe('groupByTrace', () => {
  it('should group findings by trace', () => {
    const findings = [
      createFinding({ traceId: 't1' }),
      createFinding({ traceId: 't1' }),
      createFinding({ traceId: 't2' }),
    ];

    const groups = groupByTrace(findings);

    expect(groups.get('t1')).toHaveLength(2);
    expect(groups.get('t2')).toHaveLength(1);
  });
});

describe('groupByAction', () => {
  it('should group findings by action name', () => {
    const findings = [
      createFinding({ actionName: 'CreateOrder' }),
      createFinding({ actionName: 'ProcessPayment' }),
      createFinding({ actionName: 'CreateOrder' }),
    ];

    const groups = groupByAction(findings);

    expect(groups.get('CreateOrder')).toHaveLength(2);
    expect(groups.get('ProcessPayment')).toHaveLength(1);
  });
});

describe('filterBySeverity', () => {
  it('should filter by minimum severity', () => {
    const findings = [
      createFinding({ severity: 'high' }),
      createFinding({ severity: 'medium' }),
      createFinding({ severity: 'low' }),
    ];

    const mediumUp = filterBySeverity(findings, 'medium');
    expect(mediumUp).toHaveLength(2);

    const highOnly = filterBySeverity(findings, 'high');
    expect(highOnly).toHaveLength(1);
  });
});

describe('sortBySeverity', () => {
  it('should sort by severity (high first)', () => {
    const findings = [
      createFinding({ severity: 'low' }),
      createFinding({ severity: 'high' }),
      createFinding({ severity: 'medium' }),
    ];

    const sorted = sortBySeverity(findings);

    expect(sorted[0].severity).toBe('high');
    expect(sorted[1].severity).toBe('medium');
    expect(sorted[2].severity).toBe('low');
  });
});

describe('InMemoryReporter', () => {
  let reporter: InMemoryReporter;

  beforeEach(() => {
    reporter = new InMemoryReporter();
  });

  it('should store reported findings', () => {
    reporter.report([createFinding()]);
    reporter.report([createFinding()]);

    expect(reporter.count()).toBe(2);
  });

  it('should get findings by type', () => {
    reporter.report([
      createFinding({ type: 'slow_action' }),
      createFinding({ type: 'high_cpu' }),
      createFinding({ type: 'silent_degradation' }),
    ]);

    expect(reporter.getFindingsByType('slow_action')).toHaveLength(1);
    expect(reporter.getSilentDegradations()).toHaveLength(1);
  });

  it('should clear findings', () => {
    reporter.report([createFinding()]);
    reporter.clear();

    expect(reporter.count()).toBe(0);
  });
});
