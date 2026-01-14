/**
 * @causality/impact-core — Type Definitions
 *
 * Types for impact scoring, audience classification, and notification policy.
 */

import type { ReproducibilityExplanation } from '@causality/reproducibility-core';

// Re-export for convenience
export type { ReproducibilityExplanation };

/**
 * Target audience for an issue.
 */
export type Audience = 'developer' | 'product' | 'ops' | 'none';

/**
 * Notification action to take.
 */
export type NotificationAction = 'alert' | 'batch' | 'store' | 'ignore';

/**
 * Priority level for an issue.
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'none';

/**
 * Issue category for scoring.
 */
export type IssueCategory = 
  | 'error'              // Explicit error
  | 'silent_degradation' // UX degradation without error
  | 'resource_pressure'  // CPU/memory/lag issues
  | 'latency'           // Slow actions
  | 'semantic_mismatch'; // Business logic issues

/**
 * Scope of impact.
 */
export type ImpactScope = 'user_facing' | 'internal' | 'infrastructure';

/**
 * Impact score breakdown.
 */
export interface ImpactScore {
  /** Overall score 0-100 */
  readonly total: number;

  /** Breakdown by factor */
  readonly breakdown: {
    /** Issue type factor (0-30) */
    readonly issueType: number;
    /** Frequency factor (0-20) */
    readonly frequency: number;
    /** Affected actions factor (0-20) */
    readonly affectedActions: number;
    /** Resource pressure factor (0-15) */
    readonly resourcePressure: number;
    /** User-facing factor (0-15) */
    readonly scope: number;
  };

  /** Priority derived from score */
  readonly priority: Priority;
}

/**
 * Frequency data for an issue.
 */
export interface FrequencyData {
  /** Number of occurrences in the window */
  readonly occurrences: number;
  /** Time window in ms */
  readonly windowMs: number;
  /** Percentage of total traces affected */
  readonly affectedPercentage: number;
}

/**
 * Audience classification result.
 */
export interface AudienceClassification {
  /** Primary audience */
  readonly primary: Audience;
  /** Secondary audiences */
  readonly secondary: Audience[];
  /** Reason for classification */
  readonly reason: string;
}

/**
 * Notification policy decision.
 */
export interface NotificationPolicy {
  /** Action to take */
  readonly action: NotificationAction;
  /** Channels to notify (if alert/batch) */
  readonly channels: NotificationChannel[];
  /** Delay before notification (for batch) */
  readonly delayMs?: number;
  /** Reason for policy decision */
  readonly reason: string;
}

/**
 * Notification channel.
 */
export interface NotificationChannel {
  readonly type: 'console' | 'webhook' | 'email' | 'slack' | 'pagerduty' | 'custom';
  readonly audience: Audience;
  readonly config?: Record<string, unknown>;
}

/**
 * Complete impact assessment.
 */
export interface ImpactAssessment {
  /** Unique ID */
  readonly id: string;

  /** Source trace ID */
  readonly traceId: string;

  /** When assessment was made */
  readonly assessedAt: number;

  /** Issue category */
  readonly category: IssueCategory;

  /** Impact scope */
  readonly scope: ImpactScope;

  /** Computed impact score */
  readonly score: ImpactScore;

  /** Audience classification */
  readonly audience: AudienceClassification;

  /** Notification policy */
  readonly policy: NotificationPolicy;

  /** Human-readable summary */
  readonly summary: string;

  /** Should this escape the system? */
  readonly shouldNotify: boolean;

  /** Original explanation */
  readonly explanation: ReproducibilityExplanation;
}

/**
 * Scoring configuration.
 */
export interface ScoringConfig {
  /** Weights for each factor (must sum to 100) */
  readonly weights?: {
    readonly issueType?: number;
    readonly frequency?: number;
    readonly affectedActions?: number;
    readonly resourcePressure?: number;
    readonly scope?: number;
  };

  /** Thresholds for priority */
  readonly priorityThresholds?: {
    readonly critical?: number;
    readonly high?: number;
    readonly medium?: number;
    readonly low?: number;
  };
}

/**
 * Default scoring weights.
 */
export const DEFAULT_WEIGHTS = {
  issueType: 30,
  frequency: 20,
  affectedActions: 20,
  resourcePressure: 15,
  scope: 15,
} as const;

/**
 * Default priority thresholds.
 */
export const DEFAULT_PRIORITY_THRESHOLDS = {
  critical: 85,
  high: 70,
  medium: 50,
  low: 25,
} as const;

/**
 * Policy configuration.
 */
export interface PolicyConfig {
  /** Score threshold for immediate alert */
  readonly alertThreshold?: number;
  /** Score threshold for batch notification */
  readonly batchThreshold?: number;
  /** Score threshold for store only */
  readonly storeThreshold?: number;
  /** Batch delay in ms */
  readonly batchDelayMs?: number;
}

/**
 * Default policy config.
 */
export const DEFAULT_POLICY_CONFIG: Required<PolicyConfig> = {
  alertThreshold: 70,
  batchThreshold: 40,
  storeThreshold: 20,
  batchDelayMs: 300000, // 5 minutes
};

/**
 * Action classification for scope detection.
 */
export interface ActionClassification {
  /** Action name patterns that indicate user-facing */
  readonly userFacingPatterns: string[];
  /** Action name patterns that indicate internal */
  readonly internalPatterns: string[];
  /** Action name patterns that indicate infrastructure */
  readonly infrastructurePatterns: string[];
}

/**
 * Default action classification patterns.
 */
export const DEFAULT_ACTION_PATTERNS: ActionClassification = {
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
