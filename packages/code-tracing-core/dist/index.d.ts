/**
 * @causality/code-tracing-core
 *
 * Code analysis and cross-service trace propagation for causality explanations.
 *
 * @example
 * import { createCodeTracer, enrichExplanation, toJson } from '@causality/code-tracing-core';
 *
 * const tracer = createCodeTracer();
 *
 * // Register mappings
 * tracer.registerCode('ProcessPayment', {
 *   file: 'src/payment/processor.ts',
 *   function: 'processPayment',
 * });
 * tracer.registerService('ProcessPayment', {
 *   name: 'payment-service',
 *   type: 'microservice',
 *   endpoint: '/api/payments',
 * });
 *
 * // Enrich explanation
 * const enriched = tracer.enrich(explanation, behaviorResult, impactAssessment);
 *
 * console.log(toJson(enriched));
 *
 * @packageDocumentation
 */
export { enrichExplanation, CodeTracer, createCodeTracer, toJson, } from './enricher.js';
export { CodeMappingRegistry, createCodeMappingRegistry, inferCodeContext, inferFileFromAction, inferFunctionFromAction, inferModuleFromAction, extractCodeContexts, } from './code-context.js';
export { ServiceMappingRegistry, createServiceMappingRegistry, inferServiceContext, inferServiceType, inferServiceName, buildPropagationChain, detectCrossServiceCalls, groupByService, getServiceFlow, } from './propagation.js';
export { integrateFindings, } from './integrator.js';
export type { IntegratedFindings } from './integrator.js';
export { generateReplayInstructions, formatInstructionsAsMarkdown, } from './replay.js';
export type { ServiceType, CodeContext, ServiceContext, PropagationStep, AnomalySummary, EnrichedMetrics, ExpectedMetrics, EnrichedCausalStep, EnrichedReplayInstruction, AudienceOutput, EnrichedExplanation, EnrichmentInput, CodeTracingConfig, ReproducibilityExplanation, BehaviorAnomaly, BehaviorAnalysisResult, ImpactAssessment, Audience, NotificationAction, } from './types.js';
export { DEFAULT_CODE_TRACING_CONFIG } from './types.js';
//# sourceMappingURL=index.d.ts.map