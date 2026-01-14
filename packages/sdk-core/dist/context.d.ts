/**
 * @causality/sdk-core — Context Propagation
 *
 * Uses AsyncLocalStorage to propagate action context through async code.
 *
 * Key rules:
 * - The first action in a context creates the traceId
 * - Child actions inherit the traceId from their parent
 * - traceId is NEVER recalculated once set
 */
import type { ActionContext } from './types.js';
/**
 * Get the current action context, if any.
 *
 * @returns The current context or undefined if not inside an action
 */
export declare function getActionContext(): ActionContext | undefined;
/**
 * Run a function within an action context.
 *
 * @param context - The action context to set
 * @param fn - The function to run
 * @returns The result of the function
 *
 * @internal
 */
export declare function runWithContext<T>(context: ActionContext, fn: () => T): T;
/**
 * Resolve the traceId for a new action.
 *
 * Rules:
 * - If there's a parent context, inherit its traceId
 * - If this is the first action (no parent), create a new traceId
 *
 * @param generateId - Function to generate a new ID
 * @returns The traceId to use
 *
 * @internal
 */
export declare function resolveTraceId(generateId: () => string): string;
/**
 * Get the parent action ID if we're inside an action.
 *
 * @returns The parent action ID or undefined
 *
 * @internal
 */
export declare function getParentActionId(): string | undefined;
//# sourceMappingURL=context.d.ts.map