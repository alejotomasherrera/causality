/**
 * @causality/predictive-core — Type Definitions
 */

import type { HistoricalReport } from '@causality/historical-core';
import type { BehaviorAnalysisResult } from '@causality/behavior-core';
import type { ImpactAssessment } from '@causality/impact-core';
import type { CodeContext } from '@causality/code-tracing-core';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory = 'performance' | 'reliability' | 'resource' | 'code';

/**
 * Structured output of a prediction.
 */
export interface PredictiveOutput {
    readonly predictionId: string;
    readonly tracePattern: string;         // e.g., "latency_degradation ProcessPayment"
    readonly impactedService: string;      // microservice name
    readonly file: string;                 // source file
    readonly function: string;             // function name
    readonly observedTrend: string;        // "degrading", "spiking", etc.
    readonly riskLevel: RiskSeverity;
    readonly category: RiskCategory;
    readonly confidence: number;           // 0-1
    readonly recommendedActions: string[]; // e.g., ["optimize DB queries", "refactor loop"]
    readonly impactForecast: {
        readonly usersAffected?: number;
        readonly durationMsIncrease?: number;
        readonly resourcePressure?: { 
            readonly cpu?: number; 
            readonly memoryMb?: number; 
        };
    };
    readonly timestamp: string; // ISO string
    readonly markdownReport: string;       // human-readable
}

/**
 * Alias for internal compatibility if needed, or deprecate.
 * We will use PredictiveOutput as the main prediction object.
 */
export type Prediction = PredictiveOutput;

/**
 * User context input.
 */
export interface UserContext {
    readonly deploymentVersion?: string;
    readonly region?: string;
    readonly environment?: string;
}

/**
 * Input context for prediction.
 */
export interface PredictiveInput {
    readonly historicalReport: HistoricalReport;
    readonly behaviorMetrics: BehaviorAnalysisResult[];
    readonly impactAssessments: ImpactAssessment[];
    readonly codeContext: CodeContext[];
    readonly userContext?: UserContext;
    
    /** Optional context configuration override */
    readonly context?: {
        timeWindow?: string;
        userImpactThreshold?: number;
        resourcePressureThreshold?: {
            cpu?: number;
            memoryMb?: number;
        };
    };
}

/**
 * Final predictive report.
 */
export interface PredictiveReport {
    readonly generatedAt: number;
    readonly predictions: PredictiveOutput[];
    readonly summaryMarkdown: string;
}

