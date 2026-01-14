/**
 * @causality/impact-core — Audience Classification
 *
 * Determine which audience should be notified about an issue.
 * Deterministic rules, no guessing.
 */
import type { ReproducibilityExplanation, AudienceClassification, Audience, IssueCategory, ImpactScope } from './types.js';
/**
 * Classify the audience for an issue.
 */
export declare function classifyAudience(explanation: ReproducibilityExplanation, category?: IssueCategory, scope?: ImpactScope): AudienceClassification;
/**
 * Check if an issue should be surfaced to any audience.
 */
export declare function shouldSurfaceToHumans(classification: AudienceClassification): boolean;
/**
 * Get all audiences that should be notified.
 */
export declare function getAllAudiences(classification: AudienceClassification): Audience[];
//# sourceMappingURL=audience.d.ts.map