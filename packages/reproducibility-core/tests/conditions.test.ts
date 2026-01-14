/**
 * Tests for Reproducibility Conditions
 */

import { extractConditions, inferReproducibilityPattern } from '../src/conditions.js';
import type { CausalStep, MetricFinding, ReproducibilityConditions } from '../src/types.js';

function createStep(
  overrides: Partial<{
    actionId: string;
    name: string;
    parentId: string;
    depth: number;
    startTime: number;
    endTime: number;
    durationMs: number;
    cpuDelta: number;
    memoryDeltaMb: number;
    eventLoopLagMs: number;
    attributes: Record<string, unknown>;
  }> = {}
): CausalStep {
  const startTime = overrides.startTime ?? 1000;
  const durationMs = overrides.durationMs ?? 100;

  return {
    order: 0,
    actionId: overrides.actionId ?? 'a1',
    name: overrides.name ?? 'Action',
    parentId: overrides.parentId,
    depth: overrides.depth ?? 0,
    startTime,
    endTime: overrides.endTime ?? startTime + durationMs,
    durationMs,
    status: 'ok',
    attributes: overrides.attributes,
    metrics: {
      durationMs,
      cpuDelta: overrides.cpuDelta ?? 10,
      memoryDeltaMb: overrides.memoryDeltaMb ?? 20,
      heapDeltaMb: 10,
      eventLoopLagMs: overrides.eventLoopLagMs,
    },
    findings: [],
    isFailurePoint: false,
    contributesToDegradation: false,
  };
}

describe('extractConditions', () => {
  describe('requiredInputs', () => {
    it('should extract inputs from attributes', () => {
      const steps: CausalStep[] = [
        createStep({
          name: 'CreateOrder',
          attributes: { userId: 'u123', amount: 100 },
        }),
      ];

      const conditions = extractConditions(steps, []);

      expect(conditions.requiredInputs).toHaveLength(2);
      expect(conditions.requiredInputs.map(i => i.name)).toContain('userId');
      expect(conditions.requiredInputs.map(i => i.name)).toContain('amount');
    });

    it('should skip internal attributes', () => {
      const steps: CausalStep[] = [
        createStep({
          attributes: { userId: 'u123', _internal: 'skip' },
        }),
      ];

      const conditions = extractConditions(steps, []);

      expect(conditions.requiredInputs).toHaveLength(1);
      expect(conditions.requiredInputs[0].name).toBe('userId');
    });

    it('should deduplicate same input values', () => {
      const steps: CausalStep[] = [
        createStep({ actionId: 'a1', attributes: { userId: 'u123' } }),
        createStep({ actionId: 'a2', attributes: { userId: 'u123' } }),
      ];

      const conditions = extractConditions(steps, []);

      expect(conditions.requiredInputs).toHaveLength(1);
    });
  });

  describe('concurrencyLevel', () => {
    it('should detect parallel execution', () => {
      const steps: CausalStep[] = [
        createStep({ actionId: 'a1', startTime: 1000, endTime: 1100 }),
        createStep({ actionId: 'a2', startTime: 1050, endTime: 1150 }),
      ];

      const conditions = extractConditions(steps, []);

      expect(conditions.concurrencyLevel).toBe(2);
    });

    it('should return 1 for sequential', () => {
      const steps: CausalStep[] = [
        createStep({ actionId: 'a1', startTime: 1000, endTime: 1100 }),
        createStep({ actionId: 'a2', startTime: 1200, endTime: 1300 }),
      ];

      const conditions = extractConditions(steps, []);

      expect(conditions.concurrencyLevel).toBe(1);
    });
  });

  describe('resourcePressure', () => {
    it('should detect CPU pressure', () => {
      const steps: CausalStep[] = [
        createStep({ cpuDelta: 50 }),
      ];

      const conditions = extractConditions(steps, [], { cpuPressureThreshold: 20 });

      expect(conditions.resourcePressure.cpuPressure).toBe(true);
      expect(conditions.resourcePressure.peakCpuDelta).toBe(50);
    });

    it('should detect memory pressure', () => {
      const steps: CausalStep[] = [
        createStep({ memoryDeltaMb: 100 }),
      ];

      const conditions = extractConditions(steps, [], { memoryPressureThreshold: 50 });

      expect(conditions.resourcePressure.memoryPressure).toBe(true);
      expect(conditions.resourcePressure.peakMemoryDeltaMb).toBe(100);
    });

    it('should detect event loop blocking', () => {
      const steps: CausalStep[] = [
        createStep({ eventLoopLagMs: 200 }),
      ];

      const conditions = extractConditions(steps, [], { eventLoopLagThreshold: 100 });

      expect(conditions.resourcePressure.eventLoopBlocked).toBe(true);
    });
  });

  describe('loadCharacteristics', () => {
    it('should calculate load characteristics', () => {
      const steps: CausalStep[] = [
        createStep({ startTime: 1000, endTime: 1100 }),
        createStep({ startTime: 1050, endTime: 1150 }),
        createStep({ startTime: 1100, endTime: 1200 }),
      ];

      const conditions = extractConditions(steps, []);

      expect(conditions.loadCharacteristics.totalActions).toBe(3);
      expect(conditions.loadCharacteristics.traceDurationMs).toBe(200);
      expect(conditions.loadCharacteristics.actionsPerSecond).toBeGreaterThan(0);
    });
  });
});

describe('inferReproducibilityPattern', () => {
  it('should identify high concurrency pattern', () => {
    const conditions: ReproducibilityConditions = {
      requiredInputs: [],
      concurrencyLevel: 5,
      timingConstraints: [],
      resourcePressure: {
        cpuPressure: false,
        peakCpuDelta: 10,
        memoryPressure: false,
        peakMemoryDeltaMb: 20,
        eventLoopBlocked: false,
      },
      loadCharacteristics: {
        totalActions: 10,
        maxConcurrentActions: 5,
        traceDurationMs: 1000,
        actionsPerSecond: 10,
      },
    };

    const patterns = inferReproducibilityPattern(conditions);

    expect(patterns.some(p => p.includes('concurrent load'))).toBe(true);
  });

  it('should identify CPU stress pattern', () => {
    const conditions: ReproducibilityConditions = {
      requiredInputs: [],
      concurrencyLevel: 1,
      timingConstraints: [],
      resourcePressure: {
        cpuPressure: true,
        peakCpuDelta: 80,
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
    };

    const patterns = inferReproducibilityPattern(conditions);

    expect(patterns.some(p => p.includes('CPU stress'))).toBe(true);
  });

  it('should identify required inputs pattern', () => {
    const conditions: ReproducibilityConditions = {
      requiredInputs: [
        { name: 'userId', value: 'u123', source: 'CreateOrder', actionId: 'a1' },
      ],
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
    };

    const patterns = inferReproducibilityPattern(conditions);

    expect(patterns.some(p => p.includes('specific inputs'))).toBe(true);
  });
});
