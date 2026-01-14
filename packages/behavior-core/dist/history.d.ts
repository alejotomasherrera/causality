/**
 * @causality/behavior-core — Execution History
 *
 * Store and query historical execution data for actions.
 * Maintains running statistics without storing individual samples.
 */
import type { ExecutionHistory, ActionMetrics } from './types.js';
/**
 * In-memory store for execution history.
 */
export declare class ExecutionHistoryStore {
    private readonly histories;
    /**
     * Record a new execution for an action.
     */
    record(metrics: ActionMetrics): void;
    /**
     * Get history for an action.
     */
    get(actionName: string): ExecutionHistory | undefined;
    /**
     * Check if we have enough history for reliable analysis.
     */
    hasReliableHistory(actionName: string, minSamples: number): boolean;
    /**
     * Get all action names with history.
     */
    getActionNames(): string[];
    /**
     * Clear history for an action.
     */
    clear(actionName: string): void;
    /**
     * Clear all history.
     */
    clearAll(): void;
    /**
     * Export history for persistence.
     */
    export(): ExecutionHistory[];
    /**
     * Import history from persistence.
     */
    import(histories: ExecutionHistory[]): void;
}
/**
 * Create a history store.
 */
export declare function createHistoryStore(): ExecutionHistoryStore;
//# sourceMappingURL=history.d.ts.map