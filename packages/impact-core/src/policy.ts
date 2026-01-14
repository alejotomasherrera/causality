/**
 * @causality/impact-core — Notification Policy
 *
 * Decide when to alert, batch, store, or ignore.
 * Clear thresholds, no guessing.
 */

import type {
  ImpactScore,
  AudienceClassification,
  NotificationPolicy,
  NotificationChannel,
  PolicyConfig,
  Audience,
  DEFAULT_POLICY_CONFIG,
} from './types.js';

/**
 * Determine notification policy based on score and audience.
 */
export function determinePolicy(
  score: ImpactScore,
  audience: AudienceClassification,
  config?: PolicyConfig
): NotificationPolicy {
  const policyConfig: Required<PolicyConfig> = {
    alertThreshold: config?.alertThreshold ?? 70,
    batchThreshold: config?.batchThreshold ?? 40,
    storeThreshold: config?.storeThreshold ?? 20,
    batchDelayMs: config?.batchDelayMs ?? 300000, // 5 minutes
  };

  // No audience → store only
  if (audience.primary === 'none') {
    return {
      action: 'store',
      channels: [],
      reason: 'No audience identified for this issue',
    };
  }

  // Determine action based on score
  const action = determineAction(score.total, policyConfig);

  // Build channels based on audience
  const channels = buildChannels(audience, action);

  // Reason
  const reason = generatePolicyReason(action, score, audience);

  return {
    action,
    channels,
    delayMs: action === 'batch' ? policyConfig.batchDelayMs : undefined,
    reason,
  };
}

/**
 * Determine action based on score thresholds.
 */
function determineAction(
  score: number,
  config: Required<PolicyConfig>
): import('./types.js').NotificationAction {
  if (score >= config.alertThreshold) {
    return 'alert';
  }
  if (score >= config.batchThreshold) {
    return 'batch';
  }
  if (score >= config.storeThreshold) {
    return 'store';
  }
  return 'ignore';
}

/**
 * Build notification channels based on audience and action.
 */
function buildChannels(
  audience: AudienceClassification,
  action: import('./types.js').NotificationAction
): NotificationChannel[] {
  if (action === 'store' || action === 'ignore') {
    return [];
  }

  const channels: NotificationChannel[] = [];
  const allAudiences = [audience.primary, ...audience.secondary];

  for (const aud of allAudiences) {
    if (aud === 'none') continue;

    // Map audience to channels
    channels.push(...getChannelsForAudience(aud, action));
  }

  // Deduplicate by type + audience
  return deduplicateChannels(channels);
}

/**
 * Get default channels for an audience.
 */
function getChannelsForAudience(
  audience: Audience,
  action: import('./types.js').NotificationAction
): NotificationChannel[] {
  const channels: NotificationChannel[] = [];

  switch (audience) {
    case 'developer':
      // Developers get console + webhook
      channels.push({ type: 'console', audience: 'developer' });
      if (action === 'alert') {
        channels.push({ type: 'slack', audience: 'developer' });
      }
      break;

    case 'product':
      // Product gets email for alerts, console for batch
      if (action === 'alert') {
        channels.push({ type: 'email', audience: 'product' });
      }
      channels.push({ type: 'console', audience: 'product' });
      break;

    case 'ops':
      // Ops get pagerduty for alerts, slack for batch
      if (action === 'alert') {
        channels.push({ type: 'pagerduty', audience: 'ops' });
      }
      channels.push({ type: 'slack', audience: 'ops' });
      break;
  }

  return channels;
}

/**
 * Deduplicate channels.
 */
function deduplicateChannels(channels: NotificationChannel[]): NotificationChannel[] {
  const seen = new Set<string>();
  const result: NotificationChannel[] = [];

  for (const channel of channels) {
    const key = `${channel.type}:${channel.audience}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(channel);
    }
  }

  return result;
}

/**
 * Generate human-readable policy reason.
 */
function generatePolicyReason(
  action: import('./types.js').NotificationAction,
  score: ImpactScore,
  audience: AudienceClassification
): string {
  switch (action) {
    case 'alert':
      return `High impact (score ${score.total}) requires immediate ${audience.primary} attention`;
    case 'batch':
      return `Medium impact (score ${score.total}) will be batched for ${audience.primary} review`;
    case 'store':
      return `Low impact (score ${score.total}) stored for historical analysis`;
    case 'ignore':
      return `Minimal impact (score ${score.total}) does not warrant notification`;
    default:
      return `Score ${score.total} processed`;
  }
}

/**
 * Check if policy requires immediate notification.
 */
export function requiresImmediateAction(policy: NotificationPolicy): boolean {
  return policy.action === 'alert';
}

/**
 * Check if policy should batch notifications.
 */
export function shouldBatch(policy: NotificationPolicy): boolean {
  return policy.action === 'batch';
}

/**
 * Check if issue should be stored.
 */
export function shouldStore(policy: NotificationPolicy): boolean {
  return policy.action === 'alert' || policy.action === 'batch' || policy.action === 'store';
}

/**
 * Check if issue should be surfaced (not ignored).
 */
export function shouldSurface(policy: NotificationPolicy): boolean {
  return policy.action !== 'ignore';
}
