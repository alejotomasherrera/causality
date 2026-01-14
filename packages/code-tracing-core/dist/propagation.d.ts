/**
 * @causality/code-tracing-core — Service Propagation
 *
 * Track how actions propagate across services.
 * Map actions to frontend, gateway, microservices, and database.
 */
import type { ServiceContext, ServiceType, PropagationStep, CausalStep, CodeContext } from './types.js';
/**
 * Service mapping registry.
 */
export declare class ServiceMappingRegistry {
    private readonly mappings;
    private readonly patterns;
    /**
     * Register a direct mapping.
     */
    register(actionName: string, context: ServiceContext): void;
    /**
     * Register a pattern-based mapping.
     */
    registerPattern(pattern: RegExp, context: Partial<ServiceContext>): void;
    /**
     * Get service context for an action.
     */
    get(actionName: string): ServiceContext | undefined;
    /**
     * Get all registered mappings.
     */
    getAllMappings(): Map<string, ServiceContext>;
    /**
     * Import mappings.
     */
    import(mappings: Map<string, ServiceContext> | Array<[string, ServiceContext]>): void;
    /**
     * Clear all mappings.
     */
    clear(): void;
}
/**
 * Infer service context from action name.
 */
export declare function inferServiceContext(actionName: string): ServiceContext;
/**
 * Infer service type from action name.
 */
export declare function inferServiceType(actionName: string): ServiceType;
/**
 * Infer service name from action name.
 */
export declare function inferServiceName(actionName: string): string;
/**
 * Build propagation chain from causal steps.
 */
export declare function buildPropagationChain(steps: CausalStep[], codeMappings: Map<string, CodeContext>, serviceMappings: Map<string, ServiceContext>, serviceRegistry?: ServiceMappingRegistry): PropagationStep[];
/**
 * Detect cross-service calls in the chain.
 */
export declare function detectCrossServiceCalls(chain: PropagationStep[]): PropagationStep[];
/**
 * Group propagation by service.
 */
export declare function groupByService(chain: PropagationStep[]): Map<string, PropagationStep[]>;
/**
 * Get service flow (ordered unique services).
 */
export declare function getServiceFlow(chain: PropagationStep[]): string[];
/**
 * Create a service mapping registry.
 */
export declare function createServiceMappingRegistry(): ServiceMappingRegistry;
//# sourceMappingURL=propagation.d.ts.map