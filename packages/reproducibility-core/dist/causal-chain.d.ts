/**
 * @causality/reproducibility-core — Causal Chain Builder
 *
 * Reconstructs the ordered causal chain from a trace.
 * Deterministic ordering based on start time and parent relationships.
 */
import type { CausalityTrace, CausalStep, ActionMetrics, MetricFinding } from './types.js';
/**
 * Build an ordered causal chain from a trace.
 * Result is deterministic given the same input.
 */
export declare function buildCausalChain(trace: CausalityTrace, metrics: ActionMetrics[], findings: MetricFinding[]): CausalStep[];
/**
 * Get the execution path to a specific action (ancestors).
 */
export declare function getExecutionPath(chain: CausalStep[], actionId: string): CausalStep[];
/**
 * Get parallel actions (actions that overlapped in time).
 */
export declare function getParallelActions(chain: CausalStep[]): CausalStep[][];
/**
 * Calculate max concurrency (peak parallel actions).
 */
export declare function calculateMaxConcurrency(chain: CausalStep[]): number;
//# sourceMappingURL=causal-chain.d.ts.map