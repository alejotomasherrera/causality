/**
 * @causality/reproducibility-core
 *
 * Reproducibility explanation engine for causal traces.
 * Transforms evidence into structured explanations oriented toward replay.
 *
 * @example
 * import { buildExplanation, ExplanationBuilder } from '@causality/reproducibility-core';
 *
 * const explanation = buildExplanation({
 *   trace,
 *   metrics,
 *   findings
 * });
 *
 * console.log(explanation.summary);
 * console.log(explanation.replayInstructions);
 *
 * @packageDocumentation
 */
export { buildExplanation, ExplanationBuilder } from './builder.js';
export { buildCausalChain, getExecutionPath, getParallelActions, calculateMaxConcurrency, } from './causal-chain.js';
export { calculateAggregateMetrics, getImpactfulFindings, getContributingSteps, summarizeEvidence, getPeakResourceStep, } from './evidence.js';
export { extractConditions, inferReproducibilityPattern, } from './conditions.js';
export { classifyIssue, calculateSeverity, generateSummary, getRootCauseAction, } from './classifier.js';
export type { CausalityTrace, CausalityActionNode, ActionMetrics, MetricFinding, IssueType, IssueSeverity, CausalStep, StepMetrics, ReproducibilityConditions, RequiredInput, TimingConstraint, ResourcePressure, LoadCharacteristics, ReproducibilityExplanation, AggregateMetrics, ReplayInstruction, ExplanationInput, ExplanationBuilderConfig, } from './types.js';
//# sourceMappingURL=index.d.ts.map