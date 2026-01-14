/**
 * @causality/reproducibility-core — Type Definitions
 *
 * Types for reproducibility explanations oriented toward replay.
 */
import type { CausalityTrace, CausalityActionNode } from '@causality/collector-core';
import type { ActionMetrics, MetricFinding } from '@causality/metrics-core';
export type { CausalityTrace, CausalityActionNode, ActionMetrics, MetricFinding };
/**
 * Classification of the issue type.
 */
export type IssueType = 'explicit_error' | 'degradation' | 'silent_degradation' | 'partial_trace';
/**
 * Severity of the issue for prioritization.
 */
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
/**
 * A single step in the causal chain.
 */
export interface CausalStep {
    /** Order in the execution sequence (0-indexed) */
    readonly order: number;
    /** Action ID */
    readonly actionId: string;
    /** Action name */
    readonly name: string;
    /** Parent action ID (for nesting context) */
    readonly parentId?: string;
    /** Depth in the action tree */
    readonly depth: number;
    /** Start timestamp */
    readonly startTime: number;
    /** End timestamp (if completed) */
    readonly endTime?: number;
    /** Duration in ms */
    readonly durationMs?: number;
    /** Action status */
    readonly status: 'ok' | 'error' | 'incomplete';
    /** User-defined attributes on the action */
    readonly attributes?: Record<string, unknown>;
    /** Associated metric evidence */
    readonly metrics?: StepMetrics;
    /** Findings associated with this step */
    readonly findings: MetricFinding[];
    /** Whether this step is the failure point */
    readonly isFailurePoint: boolean;
    /** Whether this step contributed to degradation */
    readonly contributesToDegradation: boolean;
}
/**
 * Metrics for a single step.
 */
export interface StepMetrics {
    readonly durationMs: number;
    readonly cpuDelta: number;
    readonly memoryDeltaMb: number;
    readonly heapDeltaMb: number;
    readonly eventLoopLagMs?: number;
}
/**
 * Conditions required to reproduce the issue.
 */
export interface ReproducibilityConditions {
    /**
     * Required inputs inferred from action attributes.
     */
    readonly requiredInputs: RequiredInput[];
    /**
     * Concurrency level observed (parallel actions).
     */
    readonly concurrencyLevel: number;
    /**
     * Timing constraints (action ordering, delays).
     */
    readonly timingConstraints: TimingConstraint[];
    /**
     * Resource pressure signals.
     */
    readonly resourcePressure: ResourcePressure;
    /**
     * Load characteristics.
     */
    readonly loadCharacteristics: LoadCharacteristics;
}
/**
 * An input required to reproduce.
 */
export interface RequiredInput {
    readonly name: string;
    readonly value: unknown;
    readonly source: string;
    readonly actionId: string;
}
/**
 * A timing constraint for reproduction.
 */
export interface TimingConstraint {
    readonly type: 'sequential' | 'parallel' | 'delayed';
    readonly actionIds: string[];
    readonly description: string;
    /** Delay between actions (if applicable) */
    readonly delayMs?: number;
}
/**
 * Resource pressure signals.
 */
export interface ResourcePressure {
    /** Whether CPU pressure was detected */
    readonly cpuPressure: boolean;
    readonly peakCpuDelta: number;
    /** Whether memory pressure was detected */
    readonly memoryPressure: boolean;
    readonly peakMemoryDeltaMb: number;
    /** Whether event loop was blocked */
    readonly eventLoopBlocked: boolean;
    readonly peakEventLoopLagMs?: number;
}
/**
 * Load characteristics.
 */
export interface LoadCharacteristics {
    /** Total actions in trace */
    readonly totalActions: number;
    /** Max concurrent actions */
    readonly maxConcurrentActions: number;
    /** Total trace duration */
    readonly traceDurationMs: number;
    /** Actions per second */
    readonly actionsPerSecond: number;
}
/**
 * The complete reproducibility explanation.
 */
export interface ReproducibilityExplanation {
    /**
     * Unique identifier for this explanation.
     */
    readonly id: string;
    /**
     * Trace ID being explained.
     */
    readonly traceId: string;
    /**
     * When the explanation was generated.
     */
    readonly generatedAt: number;
    /**
     * Classification of the issue.
     */
    readonly issueType: IssueType;
    /**
     * Severity assessment.
     */
    readonly severity: IssueSeverity;
    /**
     * Human-readable summary of what happened.
     */
    readonly summary: string;
    /**
     * Ordered causal chain of steps.
     */
    readonly causalChain: CausalStep[];
    /**
     * The failure point (if error) or degradation point (if degradation).
     */
    readonly failurePoint?: CausalStep;
    /**
     * Conditions required to reproduce.
     */
    readonly conditions: ReproducibilityConditions;
    /**
     * All findings from the trace.
     */
    readonly findings: MetricFinding[];
    /**
     * Aggregate metrics for the entire trace.
     */
    readonly aggregateMetrics: AggregateMetrics;
    /**
     * Replay instructions.
     */
    readonly replayInstructions: ReplayInstruction[];
}
/**
 * Aggregate metrics for the trace.
 */
export interface AggregateMetrics {
    readonly totalDurationMs: number;
    readonly totalCpuDelta: number;
    readonly totalMemoryDeltaMb: number;
    readonly maxCpuDelta: number;
    readonly maxMemoryDeltaMb: number;
    readonly maxEventLoopLagMs?: number;
    readonly actionCount: number;
    readonly errorCount: number;
    readonly degradedActionCount: number;
}
/**
 * A replay instruction for reproducing the issue.
 */
export interface ReplayInstruction {
    readonly step: number;
    readonly action: string;
    readonly description: string;
    readonly type: 'execute' | 'wait' | 'verify' | 'setup';
    /** Action attributes to include */
    readonly inputs?: Record<string, unknown>;
    /** Wait time in ms */
    readonly waitMs?: number;
}
/**
 * Input for building an explanation.
 */
export interface ExplanationInput {
    readonly trace: CausalityTrace;
    readonly metrics: ActionMetrics[];
    readonly findings: MetricFinding[];
}
/**
 * Configuration for the explanation builder.
 */
export interface ExplanationBuilderConfig {
    /** Threshold for CPU pressure detection */
    readonly cpuPressureThreshold?: number;
    /** Threshold for memory pressure detection */
    readonly memoryPressureThreshold?: number;
    /** Threshold for event loop blocking */
    readonly eventLoopLagThreshold?: number;
}
//# sourceMappingURL=types.d.ts.map