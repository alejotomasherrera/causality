/**
 * @causality/code-tracing-core — Integrator
 *
 * Combine findings from Behavior Core, Impact Core, and Reproducibility Core.
 */

import type {
  ReproducibilityExplanation,
  BehaviorAnalysisResult,
  ImpactAssessment,
  AnomalySummary,
  EnrichedMetrics,
  ExpectedMetrics,
  AudienceOutput,
  NotificationAction,
} from './types.js';

/**
 * Integrated findings from all cores.
 */
export interface IntegratedFindings {
  /** Anomalies detected */
  readonly anomalies: AnomalySummary[];
  /** Observed metrics */
  readonly metricsObserved: EnrichedMetrics;
  /** Expected metrics */
  readonly metricsExpected: ExpectedMetrics;
  /** Impact score */
  readonly impactScore: number;
  /** Audience */
  readonly audience: AudienceOutput;
  /** Policy action */
  readonly policyAction: NotificationAction;
  /** Combined summary */
  readonly summary: string;
}

/**
 * Integrate findings from all cores.
 */
export function integrateFindings(
  explanation: ReproducibilityExplanation,
  behaviorResult?: BehaviorAnalysisResult,
  impactAssessment?: ImpactAssessment
): IntegratedFindings {
  // Extract anomalies
  const anomalies = extractAnomalies(explanation, behaviorResult);

  // Extract metrics
  const metricsObserved = extractObservedMetrics(explanation, behaviorResult);
  const metricsExpected = extractExpectedMetrics(explanation, behaviorResult);

  // Impact assessment or defaults
  const impactScore = impactAssessment?.score.total ?? calculateDefaultScore(explanation);
  const audience = extractAudience(impactAssessment, explanation);
  const policyAction = impactAssessment?.policy.action ?? 'store';

  // Combined summary
  const summary = generateIntegratedSummary(
    explanation,
    anomalies,
    impactScore,
    audience
  );

  return {
    anomalies,
    metricsObserved,
    metricsExpected,
    impactScore,
    audience,
    policyAction,
    summary,
  };
}

/**
 * Extract anomalies from all sources.
 */
function extractAnomalies(
  explanation: ReproducibilityExplanation,
  behaviorResult?: BehaviorAnalysisResult
): AnomalySummary[] {
  const anomalies: AnomalySummary[] = [];

  // From behavior analysis
  if (behaviorResult?.anomaly.observedAnomaly) {
    anomalies.push({
      type: behaviorResult.anomaly.anomalyType ?? 'unknown',
      deviationMagnitude: behaviorResult.anomaly.deviationMagnitude ?? 0,
      confidence: behaviorResult.anomaly.confidence,
      repeatSensitivity: behaviorResult.anomaly.repeatSensitivity,
      reason: behaviorResult.anomaly.reason,
    });
  }

  // From reproducibility findings
  for (const finding of explanation.findings) {
    if (!anomalies.some(a => a.reason === finding.message)) {
      anomalies.push({
        type: finding.type,
        deviationMagnitude: 0, // Not calculated in reproducibility
        confidence: severityToConfidence(finding.severity),
        repeatSensitivity: 'flag', // Findings from reproducibility are already significant
        reason: finding.message,
      });
    }
  }

  return anomalies;
}

/**
 * Extract observed metrics.
 */
function extractObservedMetrics(
  explanation: ReproducibilityExplanation,
  behaviorResult?: BehaviorAnalysisResult
): EnrichedMetrics {
  if (behaviorResult) {
    return {
      durationMs: behaviorResult.anomaly.metricsObserved.durationMs,
      cpuDelta: behaviorResult.anomaly.metricsObserved.cpuDelta,
      memoryDeltaMb: behaviorResult.anomaly.metricsObserved.memoryDeltaMb,
      eventLoopLagMs: behaviorResult.anomaly.metricsObserved.eventLoopLagMs,
    };
  }

  return {
    durationMs: explanation.aggregateMetrics.totalDurationMs,
    cpuDelta: explanation.aggregateMetrics.totalCpuDelta,
    memoryDeltaMb: explanation.aggregateMetrics.totalMemoryDeltaMb,
  };
}

/**
 * Extract expected metrics.
 */
function extractExpectedMetrics(
  explanation: ReproducibilityExplanation,
  behaviorResult?: BehaviorAnalysisResult
): ExpectedMetrics {
  if (behaviorResult) {
    return {
      cpu: behaviorResult.anomaly.metricsExpected.cpu,
      memory: behaviorResult.anomaly.metricsExpected.memory,
      durationMs: behaviorResult.anomaly.metricsExpected.durationMs,
      thresholds: behaviorResult.anomaly.metricsExpected.thresholds,
    };
  }

  // Default baseline from reprodicibility data
  return {
    cpu: 'medium',
    memory: 'medium',
    durationMs: explanation.aggregateMetrics.totalDurationMs * 0.5, // Expected to be half
    thresholds: {
      durationP95: explanation.aggregateMetrics.totalDurationMs,
      durationP99: explanation.aggregateMetrics.totalDurationMs * 1.5,
      cpuP95: explanation.aggregateMetrics.maxCpuDelta,
      memoryP95: explanation.aggregateMetrics.maxMemoryDeltaMb,
    },
  };
}

/**
 * Extract audience information.
 */
function extractAudience(
  impactAssessment: ImpactAssessment | undefined,
  explanation: ReproducibilityExplanation
): AudienceOutput {
  if (impactAssessment) {
    return {
      primary: impactAssessment.audience.primary,
      secondary: impactAssessment.audience.secondary,
      reason: impactAssessment.audience.reason,
    };
  }

  // Default based on issue type
  const primary = explanation.issueType === 'explicit_error' ? 'developer' : 'product';
  return {
    primary,
    secondary: [],
    reason: `Default audience for ${explanation.issueType}`,
  };
}

/**
 * Calculate default impact score from explanation.
 */
function calculateDefaultScore(explanation: ReproducibilityExplanation): number {
  let score = 0;

  // Issue type factor
  switch (explanation.issueType) {
    case 'explicit_error':
      score += 30;
      break;
    case 'silent_degradation':
      score += 25;
      break;
    case 'degradation':
      score += 20;
      break;
    default:
      score += 15;
  }

  // Severity factor
  switch (explanation.severity) {
    case 'critical':
      score += 20;
      break;
    case 'high':
      score += 15;
      break;
    case 'medium':
      score += 10;
      break;
    default:
      score += 5;
  }

  return score;
}

/**
 * Generate integrated summary.
 */
function generateIntegratedSummary(
  explanation: ReproducibilityExplanation,
  anomalies: AnomalySummary[],
  impactScore: number,
  audience: AudienceOutput
): string {
  const parts: string[] = [];

  // Issue type
  parts.push(explanation.issueType.replace(/_/g, ' '));

  // Failure point
  if (explanation.failurePoint) {
    parts.push(`in "${explanation.failurePoint.name}"`);
  }

  // Anomalies
  if (anomalies.length > 0) {
    const types = [...new Set(anomalies.map(a => a.type))];
    parts.push(`(${types.join(', ')})`);
  }

  // Impact and audience
  parts.push(`| impact: ${impactScore} → ${audience.primary}`);

  return parts.join(' ');
}

/**
 * Convert severity to confidence.
 */
function severityToConfidence(severity: string): number {
  switch (severity) {
    case 'critical':
      return 1.0;
    case 'high':
      return 0.85;
    case 'medium':
      return 0.7;
    case 'low':
      return 0.5;
    default:
      return 0.5;
  }
}
