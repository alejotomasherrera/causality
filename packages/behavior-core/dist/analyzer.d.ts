/**
 * @causality/behavior-core — Behavior Analyzer
 *
 * Main orchestrator for behavioral consistency analysis.
 * Produces deterministic, structured output for Impact Core integration.
 */
import type { ActionMetrics, MetricFinding, ExecutionHistory, SourceContext, ActionContext, BehaviorAnalysisResult, BehaviorAnalysisConfig, AnalysisInput } from './types.js';
/**
 * Behavior Analyzer orchestrates the full analysis pipeline.
 */
export declare class BehaviorAnalyzer {
    private readonly config;
    private readonly historyStore;
    private readonly occurrenceTracker;
    constructor(config?: BehaviorAnalysisConfig);
    /**
     * Record an execution to build history.
     */
    recordExecution(metrics: ActionMetrics): void;
    /**
     * Analyze an action for behavioral anomalies.
     */
    analyze(input: AnalysisInput): BehaviorAnalysisResult | null;
    /**
     * Analyze using stored history.
     */
    analyzeWithStoredHistory(context: ActionContext, metrics: ActionMetrics, source: SourceContext, findings?: MetricFinding[]): BehaviorAnalysisResult | null;
    /**
     * Quick check if an action is behaving anomalously.
     */
    isAnomalous(metrics: ActionMetrics): boolean;
    /**
     * Get history for an action.
     */
    getHistory(actionName: string): ExecutionHistory | undefined;
    /**
     * Check if analysis is possible for an action.
     */
    canAnalyze(actionName: string): boolean;
    /**
     * Get all actions with sufficient history.
     */
    getAnalyzableActions(): string[];
    /**
     * Get occurrence count for an action.
     */
    getOccurrenceCount(actionName: string): number;
    /**
     * Reset occurrence counts (e.g., after addressing issues).
     */
    resetOccurrences(actionName?: string): void;
    /**
     * Export current state for persistence.
     */
    export(): {
        histories: ExecutionHistory[];
    };
    /**
     * Import state from persistence.
     */
    import(state: {
        histories: ExecutionHistory[];
    }): void;
}
/**
 * Analyze a single input without maintaining state.
 */
export declare function analyzeBehavior(input: AnalysisInput, config?: BehaviorAnalysisConfig): BehaviorAnalysisResult | null;
/**
 * Convert BehaviorAnalysisResult to JSON for Impact Core.
 */
export declare function toImpactJson(result: BehaviorAnalysisResult): string;
/**
 * Create a behavior analyzer.
 */
export declare function createBehaviorAnalyzer(config?: BehaviorAnalysisConfig): BehaviorAnalyzer;
//# sourceMappingURL=analyzer.d.ts.map