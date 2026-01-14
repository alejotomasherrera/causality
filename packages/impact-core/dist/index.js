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
// Main assessor
export { assessImpact, ImpactAssessor } from './assessor.js';
// Scoring
export { calculateImpactScore, extractIssueCategory, detectImpactScope, } from './scoring.js';
// Audience
export { classifyAudience, shouldSurfaceToHumans, getAllAudiences, } from './audience.js';
// Policy
export { determinePolicy, requiresImmediateAction, shouldBatch, shouldStore, shouldSurface, } from './policy.js';
// Default configs
export { DEFAULT_WEIGHTS, DEFAULT_PRIORITY_THRESHOLDS, DEFAULT_POLICY_CONFIG, DEFAULT_ACTION_PATTERNS, } from './types.js';
//# sourceMappingURL=index.js.map