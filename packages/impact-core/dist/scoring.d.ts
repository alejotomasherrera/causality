/**
 * @causality/impact-core — Impact Scoring
 *
 * Compute deterministic impact scores based on concrete factors.
 * No heuristics, no AI — just thresholds.
 */
import type { ReproducibilityExplanation, ImpactScore, FrequencyData, IssueCategory, ImpactScope, ScoringConfig, ActionClassification } from './types.js';
/**
 * Calculate impact score from an explanation.
 */
export declare function calculateImpactScore(explanation: ReproducibilityExplanation, frequency: FrequencyData, config?: ScoringConfig): ImpactScore;
/**
 * Extract issue category from explanation.
 */
export declare function extractIssueCategory(explanation: ReproducibilityExplanation): IssueCategory;
/**
 * Detect impact scope from affected actions.
 */
export declare function detectImpactScope(explanation: ReproducibilityExplanation, patterns?: ActionClassification): ImpactScope;
//# sourceMappingURL=scoring.d.ts.map