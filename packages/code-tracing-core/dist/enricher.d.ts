/**
 * @causality/code-tracing-core — Enricher
 *
 * Generate enriched explanations with full code and service context.
 * Main entry point for the code tracing pipeline.
 */
import type { EnrichedExplanation, EnrichmentInput, CodeContext, ServiceContext, CodeTracingConfig } from './types.js';
import { CodeMappingRegistry } from './code-context.js';
import { ServiceMappingRegistry } from './propagation.js';
/**
 * Enrich a reproducibility explanation with code and service context.
 */
export declare function enrichExplanation(input: EnrichmentInput, config?: CodeTracingConfig): EnrichedExplanation;
/**
 * Code Tracer class for stateful usage.
 */
export declare class CodeTracer {
    private readonly codeRegistry;
    private readonly serviceRegistry;
    private readonly config;
    constructor(config?: CodeTracingConfig);
    /**
     * Register code mapping.
     */
    registerCode(actionName: string, context: Omit<CodeContext, 'actionName'>): void;
    /**
     * Register service mapping.
     */
    registerService(actionName: string, context: ServiceContext): void;
    /**
     * Enrich an explanation.
     */
    enrich(explanation: import('./types.js').ReproducibilityExplanation, behaviorResult?: import('./types.js').BehaviorAnalysisResult, impactAssessment?: import('./types.js').ImpactAssessment): EnrichedExplanation;
    /**
     * Get code registry.
     */
    getCodeRegistry(): CodeMappingRegistry;
    /**
     * Get service registry.
     */
    getServiceRegistry(): ServiceMappingRegistry;
}
/**
 * Convert enriched explanation to JSON.
 */
export declare function toJson(enriched: EnrichedExplanation): string;
/**
 * Create a code tracer.
 */
export declare function createCodeTracer(config?: CodeTracingConfig): CodeTracer;
//# sourceMappingURL=enricher.d.ts.map