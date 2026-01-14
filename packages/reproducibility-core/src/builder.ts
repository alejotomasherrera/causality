/**
 * @causality/reproducibility-core — Explanation Builder
 *
 * Orchestrates the construction of a ReproducibilityExplanation.
 */

import { randomUUID } from 'crypto';
import type {
  CausalityTrace,
  ActionMetrics,
  MetricFinding,
  ReproducibilityExplanation,
  ExplanationInput,
  ExplanationBuilderConfig,
  CausalStep,
  ReplayInstruction,
} from './types.js';
import { buildCausalChain, getExecutionPath } from './causal-chain.js';
import { calculateAggregateMetrics, getContributingSteps } from './evidence.js';
import { extractConditions, inferReproducibilityPattern } from './conditions.js';
import {
  classifyIssue,
  calculateSeverity,
  generateSummary,
  getRootCauseAction,
} from './classifier.js';

/**
 * Build a reproducibility explanation from trace data.
 * Output is deterministic given the same input.
 */
export function buildExplanation(
  input: ExplanationInput,
  config?: ExplanationBuilderConfig
): ReproducibilityExplanation {
  const { trace, metrics, findings } = input;

  // Build causal chain
  const causalChain = buildCausalChain(trace, metrics, findings);

  // Classify issue
  const issueType = classifyIssue(trace, causalChain, findings);
  const severity = calculateSeverity(issueType, causalChain, findings);
  const summary = generateSummary(issueType, severity, causalChain, findings);

  // Find failure point
  const failurePoint = causalChain.find((s) => s.isFailurePoint);

  // Extract conditions
  const conditions = extractConditions(causalChain, findings, config);

  // Calculate aggregate metrics
  const aggregateMetrics = calculateAggregateMetrics(causalChain, findings);

  // Generate replay instructions
  const replayInstructions = generateReplayInstructions(
    causalChain,
    conditions,
    failurePoint
  );

  return {
    id: generateDeterministicId(trace.traceId),
    traceId: trace.traceId,
    generatedAt: Date.now(),
    issueType,
    severity,
    summary,
    causalChain,
    failurePoint,
    conditions,
    findings,
    aggregateMetrics,
    replayInstructions,
  };
}

/**
 * Generate a deterministic ID based on trace ID.
 */
function generateDeterministicId(traceId: string): string {
  // Create a deterministic ID from the trace ID
  return `repro-${traceId.slice(0, 8)}`;
}

/**
 * Generate replay instructions for reproducing the issue.
 */
function generateReplayInstructions(
  chain: CausalStep[],
  conditions: import('./types.js').ReproducibilityConditions,
  failurePoint?: CausalStep
): ReplayInstruction[] {
  const instructions: ReplayInstruction[] = [];
  let stepNumber = 1;

  // Setup instructions for required inputs
  if (conditions.requiredInputs.length > 0) {
    const inputs: Record<string, unknown> = {};
    for (const input of conditions.requiredInputs) {
      inputs[input.name] = input.value;
    }

    instructions.push({
      step: stepNumber++,
      action: 'setup',
      type: 'setup',
      description: 'Configure required inputs',
      inputs,
    });
  }

  // Setup for resource pressure
  if (conditions.resourcePressure.cpuPressure) {
    instructions.push({
      step: stepNumber++,
      action: 'simulate_cpu_load',
      type: 'setup',
      description: `Simulate CPU pressure (target: ${conditions.resourcePressure.peakCpuDelta.toFixed(1)}% delta)`,
    });
  }

  if (conditions.resourcePressure.memoryPressure) {
    instructions.push({
      step: stepNumber++,
      action: 'allocate_memory',
      type: 'setup',
      description: `Allocate memory to simulate pressure (target: ${conditions.resourcePressure.peakMemoryDeltaMb.toFixed(1)}MB)`,
    });
  }

  // Execution instructions following causal order
  const rootActions = chain.filter((s) => s.depth === 0);

  for (const rootAction of rootActions) {
    instructions.push({
      step: stepNumber++,
      action: rootAction.name,
      type: 'execute',
      description: `Execute "${rootAction.name}"`,
      inputs: rootAction.attributes,
    });

    // Add wait if there's a delay to next action
    const rootIndex = chain.indexOf(rootAction);
    if (rootIndex < chain.length - 1) {
      const nextRoot = chain.slice(rootIndex + 1).find((s) => s.depth === 0);
      if (nextRoot && rootAction.endTime) {
        const delay = nextRoot.startTime - rootAction.endTime;
        if (delay >= 10) {
          instructions.push({
            step: stepNumber++,
            action: 'wait',
            type: 'wait',
            description: `Wait ${delay}ms before next action`,
            waitMs: delay,
          });
        }
      }
    }
  }

  // Verification at failure point
  if (failurePoint) {
    instructions.push({
      step: stepNumber++,
      action: failurePoint.name,
      type: 'verify',
      description: `Verify issue manifests at "${failurePoint.name}"`,
    });
  }

  return instructions;
}

/**
 * Create an explanation builder with preset configuration.
 */
export class ExplanationBuilder {
  private readonly config: ExplanationBuilderConfig;

  constructor(config?: ExplanationBuilderConfig) {
    this.config = config ?? {};
  }

  /**
   * Build an explanation from input data.
   */
  build(input: ExplanationInput): ReproducibilityExplanation {
    return buildExplanation(input, this.config);
  }

  /**
   * Build explanation from separate components.
   */
  buildFromComponents(
    trace: CausalityTrace,
    metrics: ActionMetrics[],
    findings: MetricFinding[]
  ): ReproducibilityExplanation {
    return this.build({ trace, metrics, findings });
  }

  /**
   * Get reproducibility patterns from the explanation.
   */
  getPatterns(explanation: ReproducibilityExplanation): string[] {
    return inferReproducibilityPattern(explanation.conditions);
  }

  /**
   * Get contributing steps (steps that matter for the issue).
   */
  getContributingSteps(explanation: ReproducibilityExplanation): CausalStep[] {
    return getContributingSteps(explanation.causalChain);
  }

  /**
   * Get the path to the failure point.
   */
  getFailurePath(explanation: ReproducibilityExplanation): CausalStep[] {
    if (!explanation.failurePoint) return [];
    return getExecutionPath(
      explanation.causalChain,
      explanation.failurePoint.actionId
    );
  }
}
