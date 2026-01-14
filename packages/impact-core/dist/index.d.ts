/**
 * @causality/impact-core
 *
 * Impact scoring and notification policy for causal issues.
 * Alert less, but better.
 *
 * @example
 * import { assessImpact, ImpactAssessor } from '@causality/impact-core';
 *
 * const assessment = assessImpact(explanation, frequency);
 *
 * if (assessment.shouldNotify) {
 *   console.log(assessment.summary);
 *   // "silent degradation in 'ProcessPayment' (impact: 72, high) → alert to product"
 * }
 *
 * @packageDocumentation
 */
export { assessImpact, ImpactAssessor } from './assessor.js';
export type { AssessorConfig, AssessmentStats } from './assessor.js';
export { calculateImpactScore, extractIssueCategory, detectImpactScope, } from './scoring.js';
export { classifyAudience, shouldSurfaceToHumans, getAllAudiences, } from './audience.js';
export { determinePolicy, requiresImmediateAction, shouldBatch, shouldStore, shouldSurface, } from './policy.js';
export type { Audience, NotificationAction, Priority, IssueCategory, ImpactScope, ImpactScore, FrequencyData, AudienceClassification, NotificationPolicy, NotificationChannel, ImpactAssessment, ScoringConfig, PolicyConfig, ActionClassification, ReproducibilityExplanation, } from './types.js';
export { DEFAULT_WEIGHTS, DEFAULT_PRIORITY_THRESHOLDS, DEFAULT_POLICY_CONFIG, DEFAULT_ACTION_PATTERNS, } from './types.js';
//# sourceMappingURL=index.d.ts.map