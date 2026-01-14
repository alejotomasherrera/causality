/**
 * Tests for Enricher
 */

import {
  enrichExplanation,
  CodeTracer,
  createCodeTracer,
  toJson,
} from '../src/enricher.js';
import type {
  ReproducibilityExplanation,
  CodeContext,
  ServiceContext,
  CausalStep,
} from '../src/types.js';

function createStep(name: string, order: number): CausalStep {
  return {
    order,
    actionId: `act-${order}`,
    name,
    depth: 0,
    startTime: 1000 + order * 100,
    endTime: 1100 + order * 100,
    durationMs: 100,
    status: 'ok',
    findings: [],
    isFailurePoint: order === 2,
    contributesToDegradation: false,
  };
}

function createExplanation(): ReproducibilityExplanation {
  const chain = [
    createStep('RenderDashboard', 0),
    createStep('FetchUserData', 1),
    createStep('ProcessPayment', 2),
  ];

  return {
    id: 'exp-1',
    traceId: 'trace-123',
    generatedAt: Date.now(),
    issueType: 'silent_degradation',
    severity: 'medium',
    summary: 'Silent degradation in ProcessPayment',
    causalChain: chain,
    failurePoint: chain[2],
    conditions: {
      requiredInputs: [
        { name: 'userId', value: 'user-123', source: 'input', actionId: 'act-1' },
        { name: 'amount', value: 100, source: 'input', actionId: 'act-2' },
      ],
      concurrencyLevel: 3,
      timingConstraints: [],
      resourcePressure: {
        cpuPressure: true,
        peakCpuDelta: 50,
        memoryPressure: false,
        peakMemoryDeltaMb: 20,
        eventLoopBlocked: false,
      },
      loadCharacteristics: {
        totalActions: 3,
        maxConcurrentActions: 3,
        traceDurationMs: 300,
        actionsPerSecond: 10,
      },
    },
    findings: [],
    aggregateMetrics: {
      totalDurationMs: 300,
      totalCpuDelta: 60,
      totalMemoryDeltaMb: 50,
      maxCpuDelta: 50,
      maxMemoryDeltaMb: 50,
      actionCount: 3,
      errorCount: 0,
      degradedActionCount: 1,
    },
    replayInstructions: [],
  };
}

describe('enrichExplanation', () => {
  it('should produce enriched explanation', () => {
    const explanation = createExplanation();
    const codeMappings = new Map<string, CodeContext>();
    const serviceMappings = new Map<string, ServiceContext>();

    const enriched = enrichExplanation({
      explanation,
      codeMappings,
      serviceMappings,
    });

    expect(enriched.traceId).toBe('trace-123');
    expect(enriched.actionName).toBeDefined();
    expect(enriched.service).toBeDefined();
    expect(enriched.file).toBeDefined();
    expect(enriched.function).toBeDefined();
    expect(enriched.metricsObserved).toBeDefined();
    expect(enriched.metricsExpected).toBeDefined();
    expect(enriched.causalChain).toHaveLength(3);
    expect(enriched.replayInstructions.length).toBeGreaterThan(0);
    expect(enriched.impactScore).toBeGreaterThan(0);
    expect(enriched.audience).toBeDefined();
    expect(enriched.policyAction).toBeDefined();
  });

  it('should use failure point as primary', () => {
    const explanation = createExplanation();

    const enriched = enrichExplanation({
      explanation,
      codeMappings: new Map(),
      serviceMappings: new Map(),
    });

    expect(enriched.actionName).toBe('ProcessPayment');
  });

  it('should extract inputs from conditions', () => {
    const explanation = createExplanation();

    const enriched = enrichExplanation({
      explanation,
      codeMappings: new Map(),
      serviceMappings: new Map(),
    });

    expect(enriched.inputs.userId).toBe('user-123');
    expect(enriched.inputs.amount).toBe(100);
    expect(enriched.inputs._concurrency).toBe(3);
  });

  it('should build enriched causal chain', () => {
    const explanation = createExplanation();

    const enriched = enrichExplanation({
      explanation,
      codeMappings: new Map(),
      serviceMappings: new Map(),
    });

    const firstStep = enriched.causalChain[0];
    expect(firstStep.actionName).toBe('RenderDashboard');
    expect(firstStep.service).toBeDefined();
    expect(firstStep.serviceType).toBe('frontend');
    expect(firstStep.file).toBeDefined();
    expect(firstStep.function).toBeDefined();
  });

  it('should use registered mappings', () => {
    const explanation = createExplanation();
    const codeMappings = new Map<string, CodeContext>([
      ['ProcessPayment', {
        file: 'src/payment/handler.ts',
        function: 'handlePayment',
        actionName: 'ProcessPayment',
      }],
    ]);

    const enriched = enrichExplanation({
      explanation,
      codeMappings,
      serviceMappings: new Map(),
    });

    expect(enriched.file).toBe('src/payment/handler.ts');
    expect(enriched.function).toBe('handlePayment');
  });
});

describe('CodeTracer', () => {
  it('should register and use code mappings', () => {
    const tracer = createCodeTracer();

    tracer.registerCode('ProcessPayment', {
      file: 'src/payment/processor.ts',
      function: 'processPayment',
    });

    const explanation = createExplanation();
    const enriched = tracer.enrich(explanation);

    expect(enriched.file).toBe('src/payment/processor.ts');
  });

  it('should register and use service mappings', () => {
    const tracer = createCodeTracer();

    tracer.registerService('ProcessPayment', {
      name: 'payment-api',
      type: 'microservice',
      endpoint: '/api/v1/payments',
    });

    const explanation = createExplanation();
    const enriched = tracer.enrich(explanation);

    expect(enriched.service).toBe('microservice');
  });
});

describe('toJson', () => {
  it('should produce valid JSON', () => {
    const explanation = createExplanation();
    const enriched = enrichExplanation({
      explanation,
      codeMappings: new Map(),
      serviceMappings: new Map(),
    });

    const json = toJson(enriched);
    const parsed = JSON.parse(json);

    expect(parsed.traceId).toBe('trace-123');
    expect(parsed.actionName).toBe('ProcessPayment');
    expect(parsed.service).toBeDefined();
    expect(parsed.file).toBeDefined();
    expect(parsed.function).toBeDefined();
    expect(parsed.inputs).toBeDefined();
    expect(parsed.metricsObserved).toBeDefined();
    expect(parsed.metricsExpected).toBeDefined();
    expect(parsed.anomalies).toBeDefined();
    expect(parsed.causalChain).toBeDefined();
    expect(parsed.replayInstructions).toBeDefined();
    expect(parsed.impactScore).toBeDefined();
    expect(parsed.audience).toBeDefined();
    expect(parsed.policyAction).toBeDefined();
  });
});

describe('Success Criterion: Deterministic JSON Output', () => {
  it('should produce identical output for same input', () => {
    const explanation = createExplanation();
    const codeMappings = new Map<string, CodeContext>();
    const serviceMappings = new Map<string, ServiceContext>();

    // Two separate calls
    const enriched1 = enrichExplanation({ explanation, codeMappings, serviceMappings });
    const enriched2 = enrichExplanation({ explanation, codeMappings, serviceMappings });

    // Normalize generatedAt for comparison
    const normalized1 = { ...enriched1, generatedAt: 0 };
    const normalized2 = { ...enriched2, generatedAt: 0 };

    expect(JSON.stringify(normalized1)).toBe(JSON.stringify(normalized2));
  });

  it('should match required output structure', () => {
    const explanation = createExplanation();
    const enriched = enrichExplanation({
      explanation,
      codeMappings: new Map(),
      serviceMappings: new Map(),
    });

    // Verify all required fields
    expect(typeof enriched.traceId).toBe('string');
    expect(typeof enriched.actionName).toBe('string');
    expect(['frontend', 'gateway', 'microservice', 'db', 'external']).toContain(enriched.service);
    expect(typeof enriched.file).toBe('string');
    expect(typeof enriched.function).toBe('string');
    expect(typeof enriched.inputs).toBe('object');

    expect(enriched.metricsObserved).toMatchObject({
      durationMs: expect.any(Number),
      cpuDelta: expect.any(Number),
      memoryDeltaMb: expect.any(Number),
    });

    expect(enriched.metricsExpected).toMatchObject({
      cpu: expect.stringMatching(/low|medium|high/),
      memory: expect.stringMatching(/low|medium|high/),
      durationMs: expect.any(Number),
    });

    expect(Array.isArray(enriched.anomalies)).toBe(true);
    expect(Array.isArray(enriched.causalChain)).toBe(true);
    expect(Array.isArray(enriched.replayInstructions)).toBe(true);

    expect(typeof enriched.impactScore).toBe('number');
    expect(enriched.audience).toMatchObject({
      primary: expect.any(String),
      secondary: expect.any(Array),
      reason: expect.any(String),
    });
    expect(['alert', 'batch', 'store', 'ignore']).toContain(enriched.policyAction);
  });
});
