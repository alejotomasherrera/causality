/**
 * @causality/impact-core — Audience Classification
 *
 * Determine which audience should be notified about an issue.
 * Deterministic rules, no guessing.
 */
import { extractIssueCategory, detectImpactScope } from './scoring.js';
/**
 * Classify the audience for an issue.
 */
export function classifyAudience(explanation, category, scope) {
    const issueCategory = category ?? extractIssueCategory(explanation);
    const impactScope = scope ?? detectImpactScope(explanation);
    // Decision matrix: category × scope → audience
    const primary = determinePrimaryAudience(issueCategory, impactScope, explanation);
    const secondary = determineSecondaryAudiences(primary, issueCategory, impactScope, explanation);
    const reason = generateAudienceReason(primary, issueCategory, impactScope);
    return {
        primary,
        secondary,
        reason,
    };
}
/**
 * Determine primary audience based on category and scope.
 */
function determinePrimaryAudience(category, scope, explanation) {
    // Error in user-facing → developer (they need to fix it)
    // Error in infrastructure → ops
    // Silent degradation in user-facing → product (UX impact)
    // Resource pressure → ops
    // Latency in internal → developer
    // Critical errors always go to developer first
    if (category === 'error' && explanation.severity === 'critical') {
        return 'developer';
    }
    // Infrastructure issues → ops
    if (scope === 'infrastructure') {
        return 'ops';
    }
    // Silent degradation in user-facing → product needs to know
    if (category === 'silent_degradation' && scope === 'user_facing') {
        return 'product';
    }
    // Resource pressure → ops
    if (category === 'resource_pressure') {
        return 'ops';
    }
    // User-facing errors → developer
    if (category === 'error' && scope === 'user_facing') {
        return 'developer';
    }
    // Latency issues in user-facing → product (if high severity) or developer
    if (category === 'latency' && scope === 'user_facing') {
        if (explanation.severity === 'high' || explanation.severity === 'critical') {
            return 'product';
        }
        return 'developer';
    }
    // Default: developer
    return 'developer';
}
/**
 * Determine secondary audiences who should also be notified.
 */
function determineSecondaryAudiences(primary, category, scope, explanation) {
    const secondary = [];
    // High severity issues → multiple audiences
    if (explanation.severity === 'high' || explanation.severity === 'critical') {
        // Developer always needs to know about high severity
        if (primary !== 'developer') {
            secondary.push('developer');
        }
        // Product needs to know about user-facing issues
        if (scope === 'user_facing' && primary !== 'product') {
            secondary.push('product');
        }
    }
    // Resource pressure → ops should always know
    if (category === 'resource_pressure' && primary !== 'ops') {
        secondary.push('ops');
    }
    // Silent degradation → product should always know
    if (category === 'silent_degradation' && primary !== 'product') {
        secondary.push('product');
    }
    // Infrastructure errors → ops needs to know
    if (scope === 'infrastructure' && category === 'error' && primary !== 'ops') {
        secondary.push('ops');
    }
    return secondary;
}
/**
 * Generate human-readable reason for classification.
 */
function generateAudienceReason(primary, category, scope) {
    const categoryDescriptions = {
        error: 'explicit error',
        silent_degradation: 'silent UX degradation',
        resource_pressure: 'resource pressure',
        latency: 'latency issue',
        semantic_mismatch: 'semantic mismatch',
    };
    const scopeDescriptions = {
        user_facing: 'user-facing',
        internal: 'internal',
        infrastructure: 'infrastructure',
    };
    const scopeDesc = scopeDescriptions[scope];
    const categoryDesc = categoryDescriptions[category];
    switch (primary) {
        case 'developer':
            return `${scopeDesc} ${categoryDesc} requires code-level investigation`;
        case 'product':
            return `${scopeDesc} ${categoryDesc} affects user experience`;
        case 'ops':
            return `${scopeDesc} ${categoryDesc} indicates operational concern`;
        case 'none':
            return 'issue does not require human attention';
        default:
            return `${scopeDesc} ${categoryDesc} detected`;
    }
}
/**
 * Check if an issue should be surfaced to any audience.
 */
export function shouldSurfaceToHumans(classification) {
    return classification.primary !== 'none';
}
/**
 * Get all audiences that should be notified.
 */
export function getAllAudiences(classification) {
    if (classification.primary === 'none') {
        return [];
    }
    return [classification.primary, ...classification.secondary];
}
//# sourceMappingURL=audience.js.map