/**
 * @causality/code-tracing-core — Integrator
 *
 * Combine findings from Behavior Core, Impact Core, and Reproducibility Core.
 */
import type { ReproducibilityExplanation, BehaviorAnalysisResult, ImpactAssessment, AnomalySummary, EnrichedMetrics, ExpectedMetrics, AudienceOutput, NotificationAction } from './types.js';
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
export declare function integrateFindings(explanation: ReproducibilityExplanation, behaviorResult?: BehaviorAnalysisResult, impactAssessment?: ImpactAssessment): IntegratedFindings;
//# sourceMappingURL=integrator.d.ts.map