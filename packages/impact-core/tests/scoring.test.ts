/**
 * Tests for Impact Scoring
 */

import { calculateImpactScore, extractIssueCategory, detectImpactScope } from '../src/scoring.js';
import type { ReproducibilityExplanation, FrequencyData } from '../src/types.js';

function createExplanation(
  overrides: Partial<{
    issueType: string;
    severity: string;
    resourcePressure: { cpuPressure: boolean; memoryPressure: boolean };
    actionNames: string[];
    errorCount: number;
    degradedCount: number;
  }> = {}
): ReproducibilityExplanation {
  const actionNames = overrides.actionNames ?? ['TestAction'];
  const causalChain = actionNames.map((name, i) => ({
    order: i,
    actionId: `a${i}`,
    name,
    depth: i === 0 ? 0 : 1,
    startTime: 1000 + i * 100,
    endTime: 1100 + i * 100,
    durationMs: 100,
    status: 'ok' as const,
    findings: [],
    isFailurePoint: i === actionNames.length - 1,
    contributesToDegradation: i < (overrides.degradedCount ?? 0),
  }));

  return {
    id: 'test-id',
    traceId: 'test-trace',
    generatedAt: Date.now(),
    issueType: (overrides.issueType ?? 'silent_degradation') as any,
    severity: (overrides.severity ?? 'medium') as any,
    summary: 'Test summary',
    causalChain,
    failurePoint: causalChain[causalChain.length - 1],
    conditions: {
      requiredInputs: [],
      concurrencyLevel: 1,
      timingConstraints: [],
      resourcePressure: {
        cpuPressure: overrides.resourcePressure?.cpuPressure ?? false,
        peakCpuDelta: overrides.resourcePressure?.cpuPressure ? 50 : 10,
        memoryPressure: overrides.resourcePressure?.memoryPressure ?? false,
        peakMemoryDeltaMb: overrides.resourcePressure?.memoryPressure ? 100 : 20,
        eventLoopBlocked: false,
      },
      loadCharacteristics: {
        totalActions: actionNames.length,
        maxConcurrentActions: 1,
        traceDurationMs: 500,
        actionsPerSecond: 2,
      },
    },
    findings: [],
    aggregateMetrics: {
      totalDurationMs: 500,
      totalCpuDelta: 30,
      totalMemoryDeltaMb: 50,
      maxCpuDelta: 30,
      maxMemoryDeltaMb: 50,
      actionCount: actionNames.length,
      errorCount: overrides.errorCount ?? 0,
      degradedActionCount: overrides.degradedCount ?? 0,
    },
    replayInstructions: [],
  };
}

const defaultFrequency: FrequencyData = {
  occurrences: 5,
  windowMs: 60000,
  affectedPercentage: 10,
};

describe('calculateImpactScore', () => {
  it('should calculate a score between 0 and 100', () => {
    const explanation = createExplanation();
    const score = calculateImpactScore(explanation, defaultFrequency);

    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });

  it('should include breakdown factors', () => {
    const explanation = createExplanation();
    const score = calculateImpactScore(explanation, defaultFrequency);

    expect(score.breakdown.issueType).toBeDefined();
    expect(score.breakdown.frequency).toBeDefined();
    expect(score.breakdown.affectedActions).toBeDefined();
    expect(score.breakdown.resourcePressure).toBeDefined();
    expect(score.breakdown.scope).toBeDefined();
  });

  it('should score errors higher than silent degradation', () => {
    const error = createExplanation({ issueType: 'explicit_error', severity: 'high' });
    const silent = createExplanation({ issueType: 'silent_degradation', severity: 'high' });

    const errorScore = calculateImpactScore(error, defaultFrequency);
    const silentScore = calculateImpactScore(silent, defaultFrequency);

    expect(errorScore.breakdown.issueType).toBeGreaterThan(silentScore.breakdown.issueType);
  });

  it('should score high frequency higher', () => {
    const explanation = createExplanation();

    const lowFreq = calculateImpactScore(explanation, {
      occurrences: 1,
      windowMs: 60000,
      affectedPercentage: 1,
    });

    const highFreq = calculateImpactScore(explanation, {
      occurrences: 100,
      windowMs: 60000,
      affectedPercentage: 50,
    });

    expect(highFreq.breakdown.frequency).toBeGreaterThan(lowFreq.breakdown.frequency);
  });

  it('should score resource pressure', () => {
    const noPressure = createExplanation({ resourcePressure: { cpuPressure: false, memoryPressure: false } });
    const withPressure = createExplanation({ resourcePressure: { cpuPressure: true, memoryPressure: true } });

    const noPressureScore = calculateImpactScore(noPressure, defaultFrequency);
    const withPressureScore = calculateImpactScore(withPressure, defaultFrequency);

    expect(withPressureScore.breakdown.resourcePressure).toBeGreaterThan(
      noPressureScore.breakdown.resourcePressure
    );
  });

  it('should derive priority from score', () => {
    // High severity error with resource pressure = high score
    const critical = createExplanation({
      issueType: 'explicit_error',
      severity: 'critical',
      resourcePressure: { cpuPressure: true, memoryPressure: true },
      actionNames: ['Dashboard', 'Checkout', 'Payment'],
      errorCount: 2,
      degradedCount: 2,
    });

    const criticalScore = calculateImpactScore(critical, {
      occurrences: 50,
      windowMs: 60000,
      affectedPercentage: 50,
    });

    // Should be at least medium priority for high-impact issues
    expect(['critical', 'high', 'medium']).toContain(criticalScore.priority);
  });

  it('should be deterministic', () => {
    const explanation = createExplanation();
    const score1 = calculateImpactScore(explanation, defaultFrequency);
    const score2 = calculateImpactScore(explanation, defaultFrequency);

    expect(score1.total).toBe(score2.total);
    expect(score1.breakdown).toEqual(score2.breakdown);
  });
});

describe('extractIssueCategory', () => {
  it('should extract error category', () => {
    const explanation = createExplanation({ issueType: 'explicit_error' });
    expect(extractIssueCategory(explanation)).toBe('error');
  });

  it('should extract silent_degradation category', () => {
    const explanation = createExplanation({ issueType: 'silent_degradation' });
    expect(extractIssueCategory(explanation)).toBe('silent_degradation');
  });

  it('should detect resource_pressure from degradation', () => {
    const explanation = createExplanation({
      issueType: 'degradation',
      resourcePressure: { cpuPressure: true, memoryPressure: false },
    });
    expect(extractIssueCategory(explanation)).toBe('resource_pressure');
  });
});

describe('detectImpactScope', () => {
  it('should detect user-facing scope', () => {
    const explanation = createExplanation({
      actionNames: ['RenderDashboard', 'DisplayChart'],
    });
    expect(detectImpactScope(explanation)).toBe('user_facing');
  });

  it('should detect infrastructure scope', () => {
    const explanation = createExplanation({
      actionNames: ['DatabaseConnect', 'CacheSync'],
    });
    expect(detectImpactScope(explanation)).toBe('infrastructure');
  });

  it('should default to internal', () => {
    const explanation = createExplanation({
      actionNames: ['ValidateInput', 'TransformData'],
    });
    expect(detectImpactScope(explanation)).toBe('internal');
  });
});
