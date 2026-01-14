/**
 * @causality/reproducibility-core — Evidence Attribution
 *
 * Associates metrics and findings to each step in the causal chain.
 */
import type { CausalStep, MetricFinding, AggregateMetrics } from './types.js';
/**
 * Calculate aggregate metrics from all steps.
 */
export declare function calculateAggregateMetrics(steps: CausalStep[], findings: MetricFinding[]): AggregateMetrics;
/**
 * Get the most impactful findings (by severity and type).
 */
export declare function getImpactfulFindings(findings: MetricFinding[], limit?: number): MetricFinding[];
/**
 * Get steps that contribute to the issue (have findings or errors).
 */
export declare function getContributingSteps(steps: CausalStep[]): CausalStep[];
/**
 * Summarize evidence for the issue.
 */
export declare function summarizeEvidence(steps: CausalStep[], findings: MetricFinding[]): string[];
/**
 * Get the peak resource usage step.
 */
export declare function getPeakResourceStep(steps: CausalStep[], metric: 'cpu' | 'memory' | 'duration'): CausalStep | undefined;
//# sourceMappingURL=evidence.d.ts.map