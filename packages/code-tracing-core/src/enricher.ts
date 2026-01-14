/**
 * @causality/code-tracing-core — Enricher
 *
 * Generate enriched explanations with full code and service context.
 * Main entry point for the code tracing pipeline.
 */

import type {
  EnrichedExplanation,
  EnrichedCausalStep,
  EnrichedReplayInstruction,
  EnrichmentInput,
  CodeContext,
  ServiceContext,
  PropagationStep,
  CodeTracingConfig,
  DEFAULT_CODE_TRACING_CONFIG,
} from './types.js';
import { extractCodeContexts, CodeMappingRegistry } from './code-context.js';
import { buildPropagationChain, getServiceFlow, ServiceMappingRegistry, inferServiceName } from './propagation.js';
import { integrateFindings } from './integrator.js';
import { generateReplayInstructions } from './replay.js';

/**
 * Enrich a reproducibility explanation with code and service context.
 */
export function enrichExplanation(
  input: EnrichmentInput,
  config?: CodeTracingConfig
): EnrichedExplanation {
  const cfg: Required<CodeTracingConfig> = {
    includeCode: config?.includeCode ?? true,
    includeServices: config?.includeServices ?? true,
    includeReplay: config?.includeReplay ?? true,
    defaultServiceType: config?.defaultServiceType ?? 'microservice',
  };

  const { explanation, behaviorResult, impactAssessment, codeMappings, serviceMappings } = input;

  // Build propagation chain
  const propagation = buildPropagationChain(
    explanation.causalChain,
    codeMappings,
    serviceMappings
  );

  // Integrate findings
  const findings = integrateFindings(explanation, behaviorResult, impactAssessment);

  // Extract inputs from explanation
  const inputs = extractInputs(explanation);

  // Determine primary action, service, file, function
  const primary = determinePrimary(explanation, propagation, codeMappings, serviceMappings);

  // Build enriched causal chain
  const causalChain = buildEnrichedCausalChain(propagation);

  // Generate replay instructions
  const replayInstructions = cfg.includeReplay
    ? generateReplayInstructions(explanation, propagation, inputs)
    : [];

  return {
    traceId: explanation.traceId,
    actionName: primary.actionName,
    serviceName: primary.serviceName,
    service: primary.serviceType,
    file: primary.file,
    function: primary.function,
    inputs,
    metricsObserved: findings.metricsObserved,
    metricsExpected: findings.metricsExpected,
    anomalies: findings.anomalies,
    causalChain,
    replayInstructions,
    impactScore: findings.impactScore,
    audience: findings.audience,
    policyAction: findings.policyAction,
    generatedAt: Date.now(),
    summary: findings.summary,
  };
}

/**
 * Extract inputs from explanation conditions.
 */
function extractInputs(explanation: import('./types.js').ReproducibilityExplanation): Record<string, unknown> {
  const inputs: Record<string, unknown> = {};

  for (const input of explanation.conditions.requiredInputs) {
    inputs[input.name] = input.value ?? `<${typeof input.value}>`;
  }

  // Add load characteristics as context
  if (explanation.conditions.loadCharacteristics.maxConcurrentActions > 1) {
    inputs._concurrency = explanation.conditions.loadCharacteristics.maxConcurrentActions;
  }

  return inputs;
}

/**
 * Determine primary action, service, file, and function.
 */
function determinePrimary(
  explanation: import('./types.js').ReproducibilityExplanation,
  propagation: PropagationStep[],
  codeMappings: Map<string, CodeContext>,
  serviceMappings: Map<string, ServiceContext>
): {
  actionName: string;
  serviceName: string;
  serviceType: import('./types.js').ServiceType;
  file: string;
  function: string;
} {
  // Use failure point if available
  if (explanation.failurePoint) {
    const code = codeMappings.get(explanation.failurePoint.name);
    const service = serviceMappings.get(explanation.failurePoint.name);

    return {
      actionName: explanation.failurePoint.name,
      serviceName: service?.name ?? inferServiceName(explanation.failurePoint.name),
      serviceType: service?.type ?? 'microservice',
      file: code?.file ?? `src/unknown/${explanation.failurePoint.name.toLowerCase()}.ts`,
      function: code?.function ?? explanation.failurePoint.name,
    };
  }

  // Use first propagation step
  if (propagation.length > 0) {
    const first = propagation[0];
    return {
      actionName: first.actionName,
      serviceName: first.service.name,
      serviceType: first.service.type,
      file: first.code.file,
      function: first.code.function,
    };
  }

  // Fallback
  return {
    actionName: 'Unknown',
    serviceName: 'unknown-service',
    serviceType: 'microservice',
    file: 'src/unknown/handler.ts',
    function: 'unknown',
  };
}

/**
 * Build enriched causal chain from propagation.
 */
function buildEnrichedCausalChain(propagation: PropagationStep[]): EnrichedCausalStep[] {
  return propagation.map((step) => ({
    actionName: step.actionName,
    service: step.service.name,
    serviceType: step.service.type,
    file: step.code.file,
    function: step.code.function,
    startTime: step.startTime,
    endTime: step.endTime,
    durationMs: step.durationMs,
    status: step.status,
  }));
}

/**
 * Code Tracer class for stateful usage.
 */
export class CodeTracer {
  private readonly codeRegistry: CodeMappingRegistry;
  private readonly serviceRegistry: ServiceMappingRegistry;
  private readonly config: Required<CodeTracingConfig>;

  constructor(config?: CodeTracingConfig) {
    this.config = {
      includeCode: config?.includeCode ?? true,
      includeServices: config?.includeServices ?? true,
      includeReplay: config?.includeReplay ?? true,
      defaultServiceType: config?.defaultServiceType ?? 'microservice',
    };
    this.codeRegistry = new CodeMappingRegistry();
    this.serviceRegistry = new ServiceMappingRegistry();
  }

  /**
   * Register code mapping.
   */
  registerCode(actionName: string, context: Omit<CodeContext, 'actionName'>): void {
    this.codeRegistry.register(actionName, context);
  }

  /**
   * Register service mapping.
   */
  registerService(actionName: string, context: ServiceContext): void {
    this.serviceRegistry.register(actionName, context);
  }

  /**
   * Enrich an explanation.
   */
  enrich(
    explanation: import('./types.js').ReproducibilityExplanation,
    behaviorResult?: import('./types.js').BehaviorAnalysisResult,
    impactAssessment?: import('./types.js').ImpactAssessment
  ): EnrichedExplanation {
    // Build mappings from registries
    const codeMappings = new Map<string, CodeContext>();
    const serviceMappings = new Map<string, ServiceContext>();

    for (const step of explanation.causalChain) {
      const code = this.codeRegistry.get(step.name);
      if (code) {
        codeMappings.set(step.name, code);
      }

      const service = this.serviceRegistry.get(step.name);
      if (service) {
        serviceMappings.set(step.name, service);
      }
    }

    return enrichExplanation({
      explanation,
      behaviorResult,
      impactAssessment,
      codeMappings,
      serviceMappings,
    }, this.config);
  }

  /**
   * Get code registry.
   */
  getCodeRegistry(): CodeMappingRegistry {
    return this.codeRegistry;
  }

  /**
   * Get service registry.
   */
  getServiceRegistry(): ServiceMappingRegistry {
    return this.serviceRegistry;
  }
}

/**
 * Convert enriched explanation to JSON.
 */
export function toJson(enriched: EnrichedExplanation): string {
  return JSON.stringify(enriched, null, 2);
}

/**
 * Create a code tracer.
 */
export function createCodeTracer(config?: CodeTracingConfig): CodeTracer {
  return new CodeTracer(config);
}
