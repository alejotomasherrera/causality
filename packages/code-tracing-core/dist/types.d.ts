/**
 * @causality/code-tracing-core — Type Definitions
 *
 * Types for code analysis, service propagation, and enriched explanations.
 */
import type { ReproducibilityExplanation, CausalStep, ReplayInstruction } from '@causality/reproducibility-core';
import type { BehaviorAnomaly, BehaviorAnalysisResult } from '@causality/behavior-core';
import type { ImpactAssessment, Audience, NotificationAction } from '@causality/impact-core';
export type { ReproducibilityExplanation, CausalStep, ReplayInstruction };
export type { BehaviorAnomaly, BehaviorAnalysisResult };
export type { ImpactAssessment, Audience, NotificationAction };
/**
 * Service type in the system.
 */
export type ServiceType = 'frontend' | 'gateway' | 'microservice' | 'db' | 'external';
/**
 * Code context for an action.
 */
export interface CodeContext {
    /** Source file path */
    readonly file: string;
    /** Function or method name */
    readonly function: string;
    /** Module or package name */
    readonly module?: string;
    /** Line range if available */
    readonly lines?: {
        start: number;
        end: number;
    };
    /** The action maps to this code */
    readonly actionName: string;
}
/**
 * Service context for an action.
 */
export interface ServiceContext {
    /** Service name */
    readonly name: string;
    /** Service type */
    readonly type: ServiceType;
    /** Endpoint (if API) */
    readonly endpoint?: string;
    /** HTTP method (if API) */
    readonly method?: string;
    /** Database table (if db) */
    readonly table?: string;
    /** Operation type (if db) */
    readonly operation?: 'read' | 'write' | 'delete' | 'update';
}
/**
 * Propagation step in the causal chain.
 */
export interface PropagationStep {
    /** Order in the chain */
    readonly order: number;
    /** Action name */
    readonly actionName: string;
    /** Service context */
    readonly service: ServiceContext;
    /** Code context */
    readonly code: CodeContext;
    /** Start time */
    readonly startTime: number;
    /** End time */
    readonly endTime?: number;
    /** Duration in ms */
    readonly durationMs?: number;
    /** Status */
    readonly status: 'ok' | 'error' | 'timeout' | 'degraded';
    /** Parent action (for nested calls) */
    readonly parentActionName?: string;
    /** Is this a cross-service call? */
    readonly isCrossService: boolean;
}
/**
 * Anomaly summary for the enriched explanation.
 */
export interface AnomalySummary {
    /** Anomaly type */
    readonly type: string;
    /** Deviation magnitude (stdDevs) */
    readonly deviationMagnitude: number;
    /** Confidence 0-1 */
    readonly confidence: number;
    /** Repeat sensitivity */
    readonly repeatSensitivity: 'singleOccurrence' | 'flag';
    /** Human-readable reason */
    readonly reason: string;
}
/**
 * Metrics observed in the enriched format.
 */
export interface EnrichedMetrics {
    readonly durationMs: number;
    readonly cpuDelta: number;
    readonly memoryDeltaMb: number;
    readonly eventLoopLagMs?: number;
}
/**
 * Expected metrics baseline.
 */
export interface ExpectedMetrics {
    readonly cpu: 'low' | 'medium' | 'high';
    readonly memory: 'low' | 'medium' | 'high';
    readonly durationMs: number;
    readonly thresholds: {
        readonly durationP95: number;
        readonly durationP99: number;
        readonly cpuP95: number;
        readonly memoryP95: number;
    };
}
/**
 * Enriched causal chain step.
 */
export interface EnrichedCausalStep {
    readonly actionName: string;
    readonly service: string;
    readonly serviceType: ServiceType;
    readonly file: string;
    readonly function: string;
    readonly startTime: number;
    readonly endTime?: number;
    readonly durationMs?: number;
    readonly status: 'ok' | 'error' | 'timeout' | 'degraded';
}
/**
 * Enriched replay instruction.
 */
export interface EnrichedReplayInstruction {
    readonly step: number;
    readonly type: 'setup' | 'action' | 'verify' | 'cleanup';
    readonly action: string;
    readonly description: string;
    readonly inputs?: Record<string, unknown>;
    readonly service?: string;
    readonly endpoint?: string;
}
/**
 * Audience classification for the output.
 */
export interface AudienceOutput {
    readonly primary: Audience;
    readonly secondary: Audience[];
    readonly reason: string;
}
/**
 * The main enriched explanation output.
 */
export interface EnrichedExplanation {
    /** Trace ID */
    readonly traceId: string;
    /** Primary action name */
    readonly actionName: string;
    /** Primary service name */
    readonly serviceName: string;
    /** Primary service type */
    readonly service: ServiceType;
    /** Primary code file */
    readonly file: string;
    /** Primary function */
    readonly function: string;
    /** Captured inputs */
    readonly inputs: Record<string, unknown>;
    /** Observed metrics */
    readonly metricsObserved: EnrichedMetrics;
    /** Expected metrics baseline */
    readonly metricsExpected: ExpectedMetrics;
    /** Detected anomalies */
    readonly anomalies: AnomalySummary[];
    /** Full causal chain with code context */
    readonly causalChain: EnrichedCausalStep[];
    /** Replay instructions */
    readonly replayInstructions: EnrichedReplayInstruction[];
    /** Impact score (0-100) */
    readonly impactScore: number;
    /** Audience classification */
    readonly audience: AudienceOutput;
    /** Policy action */
    readonly policyAction: NotificationAction;
    /** Generated at timestamp */
    readonly generatedAt: number;
    /** Summary for humans */
    readonly summary: string;
}
/**
 * Input for enrichment.
 */
export interface EnrichmentInput {
    /** Reproducibility explanation from Phase 4A */
    readonly explanation: ReproducibilityExplanation;
    /** Behavior analysis result from Phase 6 */
    readonly behaviorResult?: BehaviorAnalysisResult;
    /** Impact assessment from Phase 5 */
    readonly impactAssessment?: ImpactAssessment;
    /** Code mappings (action → code) */
    readonly codeMappings: Map<string, CodeContext>;
    /** Service mappings (action → service) */
    readonly serviceMappings: Map<string, ServiceContext>;
}
/**
 * Configuration for code tracing.
 */
export interface CodeTracingConfig {
    /** Include code context */
    readonly includeCode?: boolean;
    /** Include service context */
    readonly includeServices?: boolean;
    /** Include replay instructions */
    readonly includeReplay?: boolean;
    /** Default service type if unknown */
    readonly defaultServiceType?: ServiceType;
}
/**
 * Default configuration.
 */
export declare const DEFAULT_CODE_TRACING_CONFIG: Required<CodeTracingConfig>;
//# sourceMappingURL=types.d.ts.map