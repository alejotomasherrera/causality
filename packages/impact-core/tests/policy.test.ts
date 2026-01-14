/**
 * Tests for Notification Policy
 */

import {
  determinePolicy,
  requiresImmediateAction,
  shouldBatch,
  shouldStore,
  shouldSurface,
} from '../src/policy.js';
import type { ImpactScore, AudienceClassification } from '../src/types.js';

function createScore(total: number, priority: string = 'medium'): ImpactScore {
  return {
    total,
    breakdown: {
      issueType: total * 0.3,
      frequency: total * 0.2,
      affectedActions: total * 0.2,
      resourcePressure: total * 0.15,
      scope: total * 0.15,
    },
    priority: priority as any,
  };
}

function createAudience(primary: string = 'developer'): AudienceClassification {
  return {
    primary: primary as any,
    secondary: [],
    reason: 'Test reason',
  };
}

describe('determinePolicy', () => {
  it('should alert for high scores', () => {
    const score = createScore(80, 'high');
    const audience = createAudience('developer');

    const policy = determinePolicy(score, audience);

    expect(policy.action).toBe('alert');
    expect(policy.channels.length).toBeGreaterThan(0);
    expect(policy.reason).toContain('immediate');
  });

  it('should batch for medium scores', () => {
    const score = createScore(55, 'medium');
    const audience = createAudience('developer');

    const policy = determinePolicy(score, audience);

    expect(policy.action).toBe('batch');
    expect(policy.delayMs).toBeDefined();
    expect(policy.reason).toContain('batched');
  });

  it('should store for low scores', () => {
    const score = createScore(30, 'low');
    const audience = createAudience('developer');

    const policy = determinePolicy(score, audience);

    expect(policy.action).toBe('store');
    expect(policy.channels).toHaveLength(0);
    expect(policy.reason).toContain('historical');
  });

  it('should ignore for very low scores', () => {
    const score = createScore(10, 'none');
    const audience = createAudience('developer');

    const policy = determinePolicy(score, audience);

    expect(policy.action).toBe('ignore');
    expect(policy.reason).toContain('Minimal');
  });

  it('should store if no audience', () => {
    const score = createScore(80);
    const audience = createAudience('none');

    const policy = determinePolicy(score, audience);

    expect(policy.action).toBe('store');
    expect(policy.reason).toContain('No audience');
  });

  it('should respect custom thresholds', () => {
    const score = createScore(50);
    const audience = createAudience('developer');

    const policy = determinePolicy(score, audience, {
      alertThreshold: 40, // Lower threshold
    });

    expect(policy.action).toBe('alert');
  });

  it('should build appropriate channels for developers', () => {
    const score = createScore(80);
    const audience = createAudience('developer');

    const policy = determinePolicy(score, audience);

    const channelTypes = policy.channels.map((c) => c.type);
    expect(channelTypes).toContain('console');
    expect(channelTypes).toContain('slack');
  });

  it('should build appropriate channels for ops alert', () => {
    const score = createScore(80);
    const audience = createAudience('ops');

    const policy = determinePolicy(score, audience);

    const channelTypes = policy.channels.map((c) => c.type);
    expect(channelTypes).toContain('pagerduty');
  });

  it('should build appropriate channels for product alert', () => {
    const score = createScore(80);
    const audience = createAudience('product');

    const policy = determinePolicy(score, audience);

    const channelTypes = policy.channels.map((c) => c.type);
    expect(channelTypes).toContain('email');
  });
});

describe('policy helpers', () => {
  it('requiresImmediateAction should return true for alert', () => {
    const policy = determinePolicy(createScore(80), createAudience());
    expect(requiresImmediateAction(policy)).toBe(true);
  });

  it('shouldBatch should return true for batch', () => {
    const policy = determinePolicy(createScore(50), createAudience());
    expect(shouldBatch(policy)).toBe(true);
  });

  it('shouldStore should return true for alert, batch, store', () => {
    expect(shouldStore(determinePolicy(createScore(80), createAudience()))).toBe(true);
    expect(shouldStore(determinePolicy(createScore(50), createAudience()))).toBe(true);
    expect(shouldStore(determinePolicy(createScore(25), createAudience()))).toBe(true);
    expect(shouldStore(determinePolicy(createScore(10), createAudience()))).toBe(false);
  });

  it('shouldSurface should return false only for ignore', () => {
    expect(shouldSurface(determinePolicy(createScore(80), createAudience()))).toBe(true);
    expect(shouldSurface(determinePolicy(createScore(10), createAudience()))).toBe(false);
  });
});
