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

// Main builder
export { buildExplanation, ExplanationBuilder } from './builder.js';

// Causal chain
export {
  buildCausalChain,
  getExecutionPath,
  getParallelActions,
  calculateMaxConcurrency,
} from './causal-chain.js';

// Evidence attribution
export {
  calculateAggregateMetrics,
  getImpactfulFindings,
  getContributingSteps,
  summarizeEvidence,
  getPeakResourceStep,
} from './evidence.js';

// Reproducibility conditions
export {
  extractConditions,
  inferReproducibilityPattern,
} from './conditions.js';

// Classification
export {
  classifyIssue,
  calculateSeverity,
  generateSummary,
  getRootCauseAction,
} from './classifier.js';

// Types
export type {
  CausalityTrace,
  CausalityActionNode,
  ActionMetrics,
  MetricFinding,
  IssueType,
  IssueSeverity,
  CausalStep,
  StepMetrics,
  ReproducibilityConditions,
  RequiredInput,
  TimingConstraint,
  ResourcePressure,
  LoadCharacteristics,
  ReproducibilityExplanation,
  AggregateMetrics,
  ReplayInstruction,
  ExplanationInput,
  ExplanationBuilderConfig,
} from './types.js';
