/**
 * Tests for Audience Classification
 */

import { classifyAudience, shouldSurfaceToHumans, getAllAudiences } from '../src/audience.js';
import type { ReproducibilityExplanation, IssueCategory, ImpactScope } from '../src/types.js';

function createExplanation(
  overrides: Partial<{
    issueType: string;
    severity: string;
  }> = {}
): ReproducibilityExplanation {
  return {
    id: 'test-id',
    traceId: 'test-trace',
    generatedAt: Date.now(),
    issueType: (overrides.issueType ?? 'silent_degradation') as any,
    severity: (overrides.severity ?? 'medium') as any,
    summary: 'Test summary',
    causalChain: [{
      order: 0,
      actionId: 'a1',
      name: 'TestAction',
      depth: 0,
      startTime: 1000,
      status: 'ok',
      findings: [],
      isFailurePoint: true,
      contributesToDegradation: true,
    }],
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
        totalActions: 1,
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
      actionCount: 1,
      errorCount: 0,
      degradedActionCount: 0,
    },
    replayInstructions: [],
  };
}

describe('classifyAudience', () => {
  it('should classify user-facing silent degradation → product', () => {
    const explanation = createExplanation({ issueType: 'silent_degradation' });
    const classification = classifyAudience(explanation, 'silent_degradation', 'user_facing');

    expect(classification.primary).toBe('product');
    expect(classification.reason).toContain('user experience');
  });

  it('should classify infrastructure error → ops', () => {
    const explanation = createExplanation({ issueType: 'explicit_error' });
    const classification = classifyAudience(explanation, 'error', 'infrastructure');

    expect(classification.primary).toBe('ops');
  });

  it('should classify resource pressure → ops', () => {
    const explanation = createExplanation();
    const classification = classifyAudience(explanation, 'resource_pressure', 'internal');

    expect(classification.primary).toBe('ops');
  });

  it('should classify user-facing error → developer', () => {
    const explanation = createExplanation({ issueType: 'explicit_error' });
    const classification = classifyAudience(explanation, 'error', 'user_facing');

    expect(classification.primary).toBe('developer');
    expect(classification.reason).toContain('code-level');
  });

  it('should include secondary audiences for high severity', () => {
    const explanation = createExplanation({
      issueType: 'explicit_error',
      severity: 'high',
    });
    const classification = classifyAudience(explanation, 'error', 'user_facing');

    // High severity user-facing error: developer primary, product secondary
    expect(classification.primary).toBe('developer');
    expect(classification.secondary).toContain('product');
  });

  it('should not have secondary audiences for low severity', () => {
    const explanation = createExplanation({ severity: 'low' });
    const classification = classifyAudience(explanation, 'latency', 'internal');

    expect(classification.secondary).toHaveLength(0);
  });
});

describe('shouldSurfaceToHumans', () => {
  it('should return true for non-none primary', () => {
    expect(shouldSurfaceToHumans({ primary: 'developer', secondary: [], reason: '' })).toBe(true);
    expect(shouldSurfaceToHumans({ primary: 'product', secondary: [], reason: '' })).toBe(true);
    expect(shouldSurfaceToHumans({ primary: 'ops', secondary: [], reason: '' })).toBe(true);
  });

  it('should return false for none primary', () => {
    expect(shouldSurfaceToHumans({ primary: 'none', secondary: [], reason: '' })).toBe(false);
  });
});

describe('getAllAudiences', () => {
  it('should combine primary and secondary', () => {
    const all = getAllAudiences({
      primary: 'developer',
      secondary: ['product', 'ops'],
      reason: '',
    });

    expect(all).toContain('developer');
    expect(all).toContain('product');
    expect(all).toContain('ops');
    expect(all).toHaveLength(3);
  });

  it('should return empty for none primary', () => {
    const all = getAllAudiences({ primary: 'none', secondary: [], reason: '' });
    expect(all).toHaveLength(0);
  });
});
