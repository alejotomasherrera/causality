/**
 * @causality/impact-core — Impact Scoring
 *
 * Compute deterministic impact scores based on concrete factors.
 * No heuristics, no AI — just thresholds.
 */

import type {
  ReproducibilityExplanation,
  ImpactScore,
  FrequencyData,
  IssueCategory,
  ImpactScope,
  Priority,
  ScoringConfig,
  ActionClassification,
  DEFAULT_WEIGHTS,
  DEFAULT_PRIORITY_THRESHOLDS,
  DEFAULT_ACTION_PATTERNS,
} from './types.js';

/**
 * Calculate impact score from an explanation.
 */
export function calculateImpactScore(
  explanation: ReproducibilityExplanation,
  frequency: FrequencyData,
  config?: ScoringConfig
): ImpactScore {
  const weights = config?.weights ?? {
    issueType: 30,
    frequency: 20,
    affectedActions: 20,
    resourcePressure: 15,
    scope: 15,
  };

  const thresholds = {
    critical: config?.priorityThresholds?.critical ?? 85,
    high: config?.priorityThresholds?.high ?? 70,
    medium: config?.priorityThresholds?.medium ?? 50,
    low: config?.priorityThresholds?.low ?? 25,
  };

  // Calculate each factor
  const issueTypeScore = calculateIssueTypeScore(explanation, weights.issueType ?? 30);
  const frequencyScore = calculateFrequencyScore(frequency, weights.frequency ?? 20);
  const affectedActionsScore = calculateAffectedActionsScore(
    explanation,
    weights.affectedActions ?? 20
  );
  const resourcePressureScore = calculateResourcePressureScore(
    explanation,
    weights.resourcePressure ?? 15
  );
  const scopeScore = calculateScopeScore(explanation, weights.scope ?? 15);

  const total =
    issueTypeScore +
    frequencyScore +
    affectedActionsScore +
    resourcePressureScore +
    scopeScore;

  const priority = derivePriority(total, thresholds);

  return {
    total: Math.round(total),
    breakdown: {
      issueType: Math.round(issueTypeScore),
      frequency: Math.round(frequencyScore),
      affectedActions: Math.round(affectedActionsScore),
      resourcePressure: Math.round(resourcePressureScore),
      scope: Math.round(scopeScore),
    },
    priority,
  };
}

/**
 * Extract issue category from explanation.
 */
export function extractIssueCategory(
  explanation: ReproducibilityExplanation
): IssueCategory {
  switch (explanation.issueType) {
    case 'explicit_error':
      return 'error';
    case 'silent_degradation':
      return 'silent_degradation';
    case 'degradation':
      // Check if it's primarily latency or resource
      if (explanation.conditions.resourcePressure.cpuPressure ||
          explanation.conditions.resourcePressure.memoryPressure) {
        return 'resource_pressure';
      }
      return 'latency';
    case 'partial_trace':
      return 'error';
    default:
      return 'latency';
  }
}

/**
 * Detect impact scope from affected actions.
 */
export function detectImpactScope(
  explanation: ReproducibilityExplanation,
  patterns?: ActionClassification
): ImpactScope {
  const actionPatterns = patterns ?? {
    userFacingPatterns: [
      'Render', 'Display', 'Show', 'Page', 'Dashboard',
      'Checkout', 'Cart', 'Order', 'Payment', 'Submit',
      'Search', 'Filter', 'Navigate', 'Click', 'Input',
    ],
    internalPatterns: [
      'Validate', 'Transform', 'Calculate', 'Process',
      'Parse', 'Serialize', 'Deserialize', 'Convert',
      'Batch', 'Queue', 'Schedule', 'Retry',
    ],
    infrastructurePatterns: [
      'Connect', 'Disconnect', 'Ping', 'Health',
      'Cache', 'Database', 'Redis', 'Kafka',
      'Migrate', 'Backup', 'Restore', 'Sync',
    ],
  };

  let userFacingCount = 0;
  let internalCount = 0;
  let infraCount = 0;

  for (const step of explanation.causalChain) {
    if (matchesPatterns(step.name, actionPatterns.userFacingPatterns)) {
      userFacingCount++;
    } else if (matchesPatterns(step.name, actionPatterns.infrastructurePatterns)) {
      infraCount++;
    } else if (matchesPatterns(step.name, actionPatterns.internalPatterns)) {
      internalCount++;
    } else {
      // Default to internal if no match
      internalCount++;
    }
  }

  // Failure point has extra weight
  if (explanation.failurePoint) {
    if (matchesPatterns(explanation.failurePoint.name, actionPatterns.userFacingPatterns)) {
      userFacingCount += 2;
    } else if (matchesPatterns(explanation.failurePoint.name, actionPatterns.infrastructurePatterns)) {
      infraCount += 2;
    }
  }

  if (userFacingCount > internalCount && userFacingCount > infraCount) {
    return 'user_facing';
  } else if (infraCount > internalCount) {
    return 'infrastructure';
  }
  return 'internal';
}

// --- Score calculation helpers ---

function calculateIssueTypeScore(
  explanation: ReproducibilityExplanation,
  maxScore: number
): number {
  // Issue type weights
  const typeWeights: Record<string, number> = {
    explicit_error: 1.0,
    silent_degradation: 0.9,
    degradation: 0.7,
    partial_trace: 0.5,
  };

  const weight = typeWeights[explanation.issueType] ?? 0.5;

  // Severity multiplier
  const severityMultipliers: Record<string, number> = {
    critical: 1.0,
    high: 0.85,
    medium: 0.6,
    low: 0.4,
  };

  const severityMult = severityMultipliers[explanation.severity] ?? 0.5;

  return maxScore * weight * severityMult;
}

function calculateFrequencyScore(
  frequency: FrequencyData,
  maxScore: number
): number {
  // Score based on affected percentage
  // 0% → 0 score, 50%+ → max score
  const percentageScore = Math.min(frequency.affectedPercentage / 50, 1);

  // Also consider raw occurrences
  // 1 occurrence → 0.2, 10+ → 1.0
  const occurrenceScore = Math.min((frequency.occurrences - 1) / 9, 1) * 0.8 + 0.2;

  // Combine: 70% percentage, 30% raw count
  return maxScore * (percentageScore * 0.7 + occurrenceScore * 0.3);
}

function calculateAffectedActionsScore(
  explanation: ReproducibilityExplanation,
  maxScore: number
): number {
  const { aggregateMetrics, causalChain } = explanation;

  // Factor 1: Error count
  const errorWeight = Math.min(aggregateMetrics.errorCount / 3, 1) * 0.4;

  // Factor 2: Degraded action ratio
  const degradedRatio =
    causalChain.length > 0
      ? aggregateMetrics.degradedActionCount / causalChain.length
      : 0;
  const degradedWeight = degradedRatio * 0.4;

  // Factor 3: Chain depth (deeper = more complex)
  const maxDepth = Math.max(...causalChain.map((s) => s.depth), 0);
  const depthWeight = Math.min(maxDepth / 5, 1) * 0.2;

  return maxScore * (errorWeight + degradedWeight + depthWeight);
}

function calculateResourcePressureScore(
  explanation: ReproducibilityExplanation,
  maxScore: number
): number {
  const { resourcePressure } = explanation.conditions;

  let score = 0;

  // CPU pressure: 0-40%
  if (resourcePressure.cpuPressure) {
    const cpuIntensity = Math.min(resourcePressure.peakCpuDelta / 80, 1);
    score += 0.4 * cpuIntensity;
  }

  // Memory pressure: 0-40%
  if (resourcePressure.memoryPressure) {
    const memIntensity = Math.min(resourcePressure.peakMemoryDeltaMb / 200, 1);
    score += 0.4 * memIntensity;
  }

  // Event loop blocking: 0-20%
  if (resourcePressure.eventLoopBlocked) {
    const lagIntensity = Math.min(
      (resourcePressure.peakEventLoopLagMs ?? 0) / 500,
      1
    );
    score += 0.2 * lagIntensity;
  }

  return maxScore * score;
}

function calculateScopeScore(
  explanation: ReproducibilityExplanation,
  maxScore: number
): number {
  const scope = detectImpactScope(explanation);

  const scopeWeights: Record<ImpactScope, number> = {
    user_facing: 1.0,
    infrastructure: 0.7,
    internal: 0.4,
  };

  return maxScore * scopeWeights[scope];
}

function derivePriority(
  score: number,
  thresholds: { critical: number; high: number; medium: number; low: number }
): Priority {
  if (score >= thresholds.critical) return 'critical';
  if (score >= thresholds.high) return 'high';
  if (score >= thresholds.medium) return 'medium';
  if (score >= thresholds.low) return 'low';
  return 'none';
}

function matchesPatterns(name: string, patterns: string[]): boolean {
  const lowerName = name.toLowerCase();
  return patterns.some((p) => lowerName.includes(p.toLowerCase()));
}
