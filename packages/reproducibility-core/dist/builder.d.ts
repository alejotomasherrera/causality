/**
 * @causality/reproducibility-core — Explanation Builder
 *
 * Orchestrates the construction of a ReproducibilityExplanation.
 */
import type { CausalityTrace, ActionMetrics, MetricFinding, ReproducibilityExplanation, ExplanationInput, ExplanationBuilderConfig, CausalStep } from './types.js';
/**
 * Build a reproducibility explanation from trace data.
 * Output is deterministic given the same input.
 */
export declare function buildExplanation(input: ExplanationInput, config?: ExplanationBuilderConfig): ReproducibilityExplanation;
/**
 * Create an explanation builder with preset configuration.
 */
export declare class ExplanationBuilder {
    private readonly config;
    constructor(config?: ExplanationBuilderConfig);
    /**
     * Build an explanation from input data.
     */
    build(input: ExplanationInput): ReproducibilityExplanation;
    /**
     * Build explanation from separate components.
     */
    buildFromComponents(trace: CausalityTrace, metrics: ActionMetrics[], findings: MetricFinding[]): ReproducibilityExplanation;
    /**
     * Get reproducibility patterns from the explanation.
     */
    getPatterns(explanation: ReproducibilityExplanation): string[];
    /**
     * Get contributing steps (steps that matter for the issue).
     */
    getContributingSteps(explanation: ReproducibilityExplanation): CausalStep[];
    /**
     * Get the path to the failure point.
     */
    getFailurePath(explanation: ReproducibilityExplanation): CausalStep[];
}
//# sourceMappingURL=builder.d.ts.map