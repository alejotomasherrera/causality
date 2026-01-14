/**
 * @causality/impact-core — Type Definitions
 *
 * Types for impact scoring, audience classification, and notification policy.
 */
/**
 * Default scoring weights.
 */
export const DEFAULT_WEIGHTS = {
    issueType: 30,
    frequency: 20,
    affectedActions: 20,
    resourcePressure: 15,
    scope: 15,
};
/**
 * Default priority thresholds.
 */
export const DEFAULT_PRIORITY_THRESHOLDS = {
    critical: 85,
    high: 70,
    medium: 50,
    low: 25,
};
/**
 * Default policy config.
 */
export const DEFAULT_POLICY_CONFIG = {
    alertThreshold: 70,
    batchThreshold: 40,
    storeThreshold: 20,
    batchDelayMs: 300000, // 5 minutes
};
/**
 * Default action classification patterns.
 */
export const DEFAULT_ACTION_PATTERNS = {
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
//# sourceMappingURL=types.js.map