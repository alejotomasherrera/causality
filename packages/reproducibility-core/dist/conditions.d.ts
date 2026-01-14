/**
 * @causality/reproducibility-core — Reproducibility Conditions
 *
 * Extracts conditions required to reproduce the issue.
 */
import type { CausalStep, ReproducibilityConditions, MetricFinding } from './types.js';
/**
 * Extract reproducibility conditions from the causal chain.
 */
export declare function extractConditions(steps: CausalStep[], findings: MetricFinding[], config?: {
    cpuPressureThreshold?: number;
    memoryPressureThreshold?: number;
    eventLoopLagThreshold?: number;
}): ReproducibilityConditions;
/**
 * Check if conditions indicate a reproducibility pattern.
 */
export declare function inferReproducibilityPattern(conditions: ReproducibilityConditions): string[];
//# sourceMappingURL=conditions.d.ts.map