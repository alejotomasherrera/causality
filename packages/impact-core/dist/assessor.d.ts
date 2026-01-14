/**
 * @causality/impact-core — Impact Assessor
 *
 * Combines scoring, audience, and policy into a complete assessment.
 */
import type { ReproducibilityExplanation, ImpactAssessment, FrequencyData, ScoringConfig, PolicyConfig, ActionClassification } from './types.js';
/**
 * Configuration for the impact assessor.
 */
export interface AssessorConfig {
    readonly scoring?: ScoringConfig;
    readonly policy?: PolicyConfig;
    readonly actionPatterns?: ActionClassification;
}
/**
 * Assess the impact of a reproducibility explanation.
 */
export declare function assessImpact(explanation: ReproducibilityExplanation, frequency: FrequencyData, config?: AssessorConfig): ImpactAssessment;
/**
 * Impact Assessor class for stateful usage.
 */
export declare class ImpactAssessor {
    private readonly config;
    constructor(config?: AssessorConfig);
    /**
     * Assess a single explanation.
     */
    assess(explanation: ReproducibilityExplanation, frequency: FrequencyData): ImpactAssessment;
    /**
     * Assess with default frequency (single occurrence).
     */
    assessSingle(explanation: ReproducibilityExplanation): ImpactAssessment;
    /**
     * Filter assessments that should notify.
     */
    filterNotifiable(assessments: ImpactAssessment[]): ImpactAssessment[];
    /**
     * Filter by priority.
     */
    filterByPriority(assessments: ImpactAssessment[], minPriority: import('./types.js').Priority): ImpactAssessment[];
    /**
     * Filter by audience.
     */
    filterByAudience(assessments: ImpactAssessment[], audience: import('./types.js').Audience): ImpactAssessment[];
    /**
     * Group assessments by action.
     */
    groupByAction(assessments: ImpactAssessment[]): Map<import('./types.js').NotificationAction, ImpactAssessment[]>;
    /**
     * Get statistics for a set of assessments.
     */
    getStats(assessments: ImpactAssessment[]): AssessmentStats;
}
/**
 * Statistics for a set of assessments.
 */
export interface AssessmentStats {
    readonly total: number;
    readonly shouldNotify: number;
    readonly byAction: Record<import('./types.js').NotificationAction, number>;
    readonly byPriority: Record<import('./types.js').Priority, number>;
    readonly byAudience: Record<import('./types.js').Audience, number>;
    readonly averageScore: number;
}
//# sourceMappingURL=assessor.d.ts.map