/**
 * @causality/code-tracing-core — Code Context
 *
 * Map actions to their source code locations.
 * Deterministic mapping based on action name patterns.
 */
import type { CodeContext, CausalStep } from './types.js';
/**
 * Code mapping registry.
 */
export declare class CodeMappingRegistry {
    private readonly mappings;
    private readonly patterns;
    /**
     * Register a direct mapping.
     */
    register(actionName: string, context: Omit<CodeContext, 'actionName'>): void;
    /**
     * Register a pattern-based mapping.
     */
    registerPattern(pattern: RegExp, context: Partial<Omit<CodeContext, 'actionName'>>): void;
    /**
     * Get code context for an action.
     */
    get(actionName: string): CodeContext | undefined;
    /**
     * Get all registered mappings.
     */
    getAllMappings(): Map<string, CodeContext>;
    /**
     * Import mappings.
     */
    import(mappings: Map<string, CodeContext> | Array<[string, CodeContext]>): void;
    /**
     * Clear all mappings.
     */
    clear(): void;
}
/**
 * Infer code context from action name.
 */
export declare function inferCodeContext(actionName: string): CodeContext;
/**
 * Infer file path from action name.
 */
export declare function inferFileFromAction(actionName: string): string;
/**
 * Infer function name from action name.
 */
export declare function inferFunctionFromAction(actionName: string): string;
/**
 * Infer module from action name.
 */
export declare function inferModuleFromAction(actionName: string): string | undefined;
/**
 * Extract code contexts from causal steps.
 */
export declare function extractCodeContexts(steps: CausalStep[], registry?: CodeMappingRegistry): Map<string, CodeContext>;
/**
 * Create a code mapping registry.
 */
export declare function createCodeMappingRegistry(): CodeMappingRegistry;
//# sourceMappingURL=code-context.d.ts.map