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
// Main enricher
export { enrichExplanation, CodeTracer, createCodeTracer, toJson, } from './enricher.js';
// Code context
export { CodeMappingRegistry, createCodeMappingRegistry, inferCodeContext, inferFileFromAction, inferFunctionFromAction, inferModuleFromAction, extractCodeContexts, } from './code-context.js';
// Service propagation
export { ServiceMappingRegistry, createServiceMappingRegistry, inferServiceContext, inferServiceType, inferServiceName, buildPropagationChain, detectCrossServiceCalls, groupByService, getServiceFlow, } from './propagation.js';
// Integration
export { integrateFindings, } from './integrator.js';
// Replay
export { generateReplayInstructions, formatInstructionsAsMarkdown, } from './replay.js';
// Default config
export { DEFAULT_CODE_TRACING_CONFIG } from './types.js';
//# sourceMappingURL=index.js.map