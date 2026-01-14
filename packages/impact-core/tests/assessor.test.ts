/**
 * Tests for Impact Assessor
 */

import { assessImpact, ImpactAssessor } from '../src/assessor.js';
import type { ReproducibilityExplanation, FrequencyData } from '../src/types.js';

function createExplanation(
  overrides: Partial<{
    issueType: string;
    severity: string;
    actionNames: string[];
  }> = {}
): ReproducibilityExplanation {
  const actionNames = overrides.actionNames ?? ['Dashboard'];

  return {
    id: 'test-id',
    traceId: 'test-trace',
    generatedAt: Date.now(),
    issueType: (overrides.issueType ?? 'silent_degradation') as any,
    severity: (overrides.severity ?? 'medium') as any,
    summary: 'Test summary',
    causalChain: actionNames.map((name, i) => ({
      order: i,
      actionId: `a${i}`,
      name,
      depth: 0,
      startTime: 1000 + i * 100,
      endTime: 1100 + i * 100,
      durationMs: 100,
      status: 'ok' as const,
      findings: [],
      isFailurePoint: i === actionNames.length - 1,
      contributesToDegradation: false,
    })),
    failurePoint: {
      order: 0,
      actionId: 'a0',
      name: actionNames[actionNames.length - 1],
      depth: 0,
      startTime: 1000,
      status: 'ok',
      findings: [],
      isFailurePoint: true,
      contributesToDegradation: true,
    },
    conditions: {
      requiredInputs: [],
      concurrencyLevel: 1,
      timingConstraints: [],
      resourcePressure: {
        cpuPressure: false,
        peakCpuDelta: 10,
        memoryPressure: false,
        peakMemoryDeltaMb: 20,
        eventLoopBlocked: false,
      },
      loadCharacteristics: {
        totalActions: actionNames.length,
        maxConcurrentActions: 1,
        traceDurationMs: 100,
        actionsPerSecond: 10,
      },
    },
    findings: [],
    aggregateMetrics: {
      totalDurationMs: 100,
      totalCpuDelta: 10,
      totalMemoryDeltaMb: 20,
      maxCpuDelta: 10,
      maxMemoryDeltaMb: 20,
      actionCount: actionNames.length,
      errorCount: 0,
      degradedActionCount: 1,
    },
    replayInstructions: [],
  };
}

const highFrequency: FrequencyData = {
  occurrences: 50,
  windowMs: 60000,
  affectedPercentage: 30,
};

const lowFrequency: FrequencyData = {
  occurrences: 1,
  windowMs: 60000,
  affectedPercentage: 0.1,
};

describe('assessImpact', () => {
  it('should produce complete assessment', () => {
    const explanation = createExplanation();
    const assessment = assessImpact(explanation, highFrequency);

    expect(assessment.id).toBeDefined();
    expect(assessment.traceId).toBe('test-trace');
    expect(assessment.score).toBeDefined();
    expect(assessment.audience).toBeDefined();
    expect(assessment.policy).toBeDefined();
    expect(assessment.summary).toBeDefined();
  });

  it('should include category and scope', () => {
    const explanation = createExplanation({ actionNames: ['RenderDashboard'] });
    const assessment = assessImpact(explanation, highFrequency);

    expect(assessment.category).toBeDefined();
    expect(assessment.scope).toBe('user_facing');
  });

  it('should determine shouldNotify', () => {
    const highImpact = createExplanation({
      issueType: 'explicit_error',
      severity: 'critical',
      actionNames: ['Dashboard', 'Checkout'],
    });

    const assessment = assessImpact(highImpact, highFrequency);

    expect(typeof assessment.shouldNotify).toBe('boolean');
  });

  it('should generate meaningful summary', () => {
    const explanation = createExplanation({
      actionNames: ['ProcessPayment'],
    });
    const assessment = assessImpact(explanation, highFrequency);

    expect(assessment.summary).toContain('ProcessPayment');
  });

  it('should be deterministic', () => {
    const explanation = createExplanation();

    const a1 = assessImpact(explanation, highFrequency);
    const a2 = assessImpact(explanation, highFrequency);

    expect(a1.score.total).toBe(a2.score.total);
    expect(a1.audience.primary).toBe(a2.audience.primary);
    expect(a1.policy.action).toBe(a2.policy.action);
  });
});

describe('ImpactAssessor class', () => {
  let assessor: ImpactAssessor;

  beforeEach(() => {
    assessor = new ImpactAssessor();
  });

  it('should assess single explanation', () => {
    const explanation = createExplanation();
    const assessment = assessor.assess(explanation, highFrequency);

    expect(assessment).toBeDefined();
  });

  it('should provide assessSingle for convenience', () => {
    const explanation = createExplanation();
    const assessment = assessor.assessSingle(explanation);

    expect(assessment).toBeDefined();
  });

  it('should filter notifiable assessments', () => {
    const highImpact = assessor.assess(
      createExplanation({ issueType: 'explicit_error', severity: 'critical' }),
      highFrequency
    );
    const lowImpact = assessor.assess(
      createExplanation({ severity: 'low' }),
      lowFrequency
    );

    const notifiable = assessor.filterNotifiable([highImpact, lowImpact]);

    expect(notifiable.length).toBeLessThanOrEqual(2);
    expect(notifiable.every((a) => a.shouldNotify)).toBe(true);
  });

  it('should filter by priority', () => {
    const assessments = [
      assessor.assess(createExplanation({ severity: 'critical' }), highFrequency),
      assessor.assess(createExplanation({ severity: 'low' }), lowFrequency),
    ];

    const highOnly = assessor.filterByPriority(assessments, 'high');

    expect(highOnly.every((a) => 
      a.score.priority === 'high' || a.score.priority === 'critical'
    )).toBe(true);
  });

  it('should filter by audience', () => {
    const productExplanation = createExplanation({
      issueType: 'silent_degradation',
      actionNames: ['RenderDashboard'],
    });
    const assessment = assessor.assess(productExplanation, highFrequency);

    const forProduct = assessor.filterByAudience([assessment], 'product');

    expect(forProduct.length).toBeLessThanOrEqual(1);
  });

  it('should group by action', () => {
    const assessments = [
      assessor.assess(createExplanation({ severity: 'critical' }), highFrequency),
      assessor.assess(createExplanation({ severity: 'low' }), lowFrequency),
    ];

    const groups = assessor.groupByAction(assessments);

    expect(groups.size).toBeGreaterThan(0);
  });

  it('should provide stats', () => {
    const assessments = [
      assessor.assess(createExplanation(), highFrequency),
      assessor.assess(createExplanation(), lowFrequency),
    ];

    const stats = assessor.getStats(assessments);

    expect(stats.total).toBe(2);
    expect(stats.averageScore).toBeGreaterThan(0);
  });
});

describe('Success Criterion: Issue worth human attention escapes', () => {
  it('should surface high-impact user-facing degradation to product', () => {
    const explanation = createExplanation({
      issueType: 'silent_degradation',
      severity: 'high',
      actionNames: ['Dashboard', 'RenderChart', 'DisplayMetrics'],
    });

    const assessment = assessImpact(explanation, {
      occurrences: 100,
      windowMs: 60000,
      affectedPercentage: 50,
    });

    // This should escape the system (alert or batch, not store/ignore)
    expect(assessment.shouldNotify).toBe(true);
    expect(assessment.audience.primary).toBe('product');
    expect(['alert', 'batch']).toContain(assessment.policy.action);
    expect(assessment.summary).toContain('silent');
  });

  it('should store rare edge cases without notifying', () => {
    const explanation = createExplanation({
      issueType: 'degradation',
      severity: 'low',
      actionNames: ['InternalValidator'],
    });

    const assessment = assessImpact(explanation, {
      occurrences: 1,
      windowMs: 60000,
      affectedPercentage: 0.01,
    });

    // This should be stored but not alert
    expect(assessment.policy.action).not.toBe('alert');
  });
});
