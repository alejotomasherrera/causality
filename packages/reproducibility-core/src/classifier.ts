/**
 * @causality/reproducibility-core — Issue Classifier
 *
 * Classifies issues deterministically based on trace and findings.
 */

import type {
  CausalStep,
  MetricFinding,
  IssueType,
  IssueSeverity,
  CausalityTrace,
} from './types.js';

/**
 * Classify the issue type from trace and findings.
 */
export function classifyIssue(
  trace: CausalityTrace,
  steps: CausalStep[],
  findings: MetricFinding[]
): IssueType {
  // Check for partial trace
  if (trace.status === 'partial') {
    return 'partial_trace';
  }

  // Check for explicit errors
  const hasError = steps.some((s) => s.status === 'error');
  if (hasError) {
    return 'explicit_error';
  }

  // Check for silent degradation
  const hasSilentDegradation = findings.some(
    (f) => f.type === 'silent_degradation'
  );
  if (hasSilentDegradation) {
    return 'silent_degradation';
  }

  // Check for any degradation findings
  const hasDegradation = findings.some(
    (f) =>
      f.type === 'slow_action' ||
      f.type === 'high_cpu' ||
      f.type === 'memory_spike' ||
      f.type === 'event_loop_lag'
  );
  if (hasDegradation) {
    return 'degradation';
  }

  // Default to silent degradation if we're building an explanation
  // (we wouldn't build an explanation for a healthy trace)
  return 'silent_degradation';
}

/**
 * Calculate severity from findings and trace status.
 */
export function calculateSeverity(
  issueType: IssueType,
  steps: CausalStep[],
  findings: MetricFinding[]
): IssueSeverity {
  // Explicit errors are at least high severity
  if (issueType === 'explicit_error') {
    const hasMultipleErrors = steps.filter((s) => s.status === 'error').length > 1;
    return hasMultipleErrors ? 'critical' : 'high';
  }

  // Check finding severities
  const hasHighSeverity = findings.some((f) => f.severity === 'high');
  const hasMediumSeverity = findings.some((f) => f.severity === 'medium');

  // Multiple high severity findings = critical
  const highCount = findings.filter((f) => f.severity === 'high').length;
  if (highCount >= 2) {
    return 'critical';
  }

  if (hasHighSeverity) {
    return 'high';
  }

  if (hasMediumSeverity) {
    return 'medium';
  }

  return 'low';
}

/**
 * Generate a human-readable summary of the issue.
 */
export function generateSummary(
  issueType: IssueType,
  severity: IssueSeverity,
  steps: CausalStep[],
  findings: MetricFinding[]
): string {
  const parts: string[] = [];

  // Issue type description
  switch (issueType) {
    case 'explicit_error':
      const errorSteps = steps.filter((s) => s.status === 'error');
      const errorNames = errorSteps.map((s) => `"${s.name}"`).join(', ');
      parts.push(`Error in action(s): ${errorNames}`);
      break;

    case 'silent_degradation':
      const degradedSteps = steps.filter((s) => s.contributesToDegradation);
      if (degradedSteps.length > 0) {
        const names = degradedSteps.map((s) => `"${s.name}"`).join(', ');
        parts.push(`Silent degradation in: ${names}`);
      } else {
        parts.push('Silent degradation detected');
      }
      break;

    case 'degradation':
      parts.push('Performance degradation detected');
      break;

    case 'partial_trace':
      parts.push('Incomplete trace (missing action completions)');
      break;
  }

  // Add key metrics
  const slowFindings = findings.filter((f) => f.type === 'slow_action');
  if (slowFindings.length > 0) {
    const maxDuration = Math.max(
      ...slowFindings.map((f) => (f.details.durationMs as number) ?? 0)
    );
    parts.push(`Peak duration: ${maxDuration}ms`);
  }

  const cpuFindings = findings.filter((f) => f.type === 'high_cpu');
  if (cpuFindings.length > 0) {
    const maxCpu = Math.max(
      ...cpuFindings.map((f) => (f.details.cpuDelta as number) ?? 0)
    );
    parts.push(`Peak CPU: ${maxCpu.toFixed(1)}%`);
  }

  const memFindings = findings.filter((f) => f.type === 'memory_spike');
  if (memFindings.length > 0) {
    const maxMem = Math.max(
      ...memFindings.map((f) => (f.details.memoryDeltaMb as number) ?? 0)
    );
    parts.push(`Peak memory: ${maxMem.toFixed(1)}MB`);
  }

  return parts.join('. ') + '.';
}

/**
 * Get the root cause action (deterministic).
 */
export function getRootCauseAction(
  steps: CausalStep[],
  findings: MetricFinding[]
): CausalStep | undefined {
  // First: explicit error
  const errorStep = steps.find((s) => s.status === 'error');
  if (errorStep) return errorStep;

  // Second: step with highest severity finding
  const findingsByAction = new Map<string, MetricFinding[]>();
  for (const f of findings) {
    const existing = findingsByAction.get(f.actionId) ?? [];
    existing.push(f);
    findingsByAction.set(f.actionId, existing);
  }

  let rootCause: CausalStep | undefined;
  let maxScore = -1;

  for (const step of steps) {
    const stepFindings = findingsByAction.get(step.actionId) ?? [];
    if (stepFindings.length === 0) continue;

    // Score based on severity and type
    let score = 0;
    for (const f of stepFindings) {
      const severityScore =
        f.severity === 'high' ? 3 : f.severity === 'medium' ? 2 : 1;
      const typeScore = f.type === 'silent_degradation' ? 2 : 1;
      score += severityScore * typeScore;
    }

    if (score > maxScore) {
      maxScore = score;
      rootCause = step;
    }
  }

  return rootCause;
}
