/**
 * @causality/impact-core — Notification Policy
 *
 * Decide when to alert, batch, store, or ignore.
 * Clear thresholds, no guessing.
 */
import type { ImpactScore, AudienceClassification, NotificationPolicy, PolicyConfig } from './types.js';
/**
 * Determine notification policy based on score and audience.
 */
export declare function determinePolicy(score: ImpactScore, audience: AudienceClassification, config?: PolicyConfig): NotificationPolicy;
/**
 * Check if policy requires immediate notification.
 */
export declare function requiresImmediateAction(policy: NotificationPolicy): boolean;
/**
 * Check if policy should batch notifications.
 */
export declare function shouldBatch(policy: NotificationPolicy): boolean;
/**
 * Check if issue should be stored.
 */
export declare function shouldStore(policy: NotificationPolicy): boolean;
/**
 * Check if issue should be surfaced (not ignored).
 */
export declare function shouldSurface(policy: NotificationPolicy): boolean;
//# sourceMappingURL=policy.d.ts.map