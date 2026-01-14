/**
 * @causality/predictive-core — Recommendation Engine
 *
 * Generates preventive recommendations.
 */

import type { RiskCategory, RiskSeverity } from './types.js';

export function generateRecommendation(
    category: RiskCategory,
    severity: RiskSeverity,
    issue: string,
    actionName: string
): string {
    if (category === 'performance') {
        if (issue === 'latency_degradation') {
            return `Analyze recent changes to ${actionName}. Check for inefficient loops or N+1 queries.`;
        }
        return `Optimize ${actionName} for better performance.`;
    }

    if (category === 'reliability') {
        if (severity === 'critical') {
            return `IMMEDIATE ATTENTION: ${actionName} is failing frequently. Review error logs and consider rollback if recent.`;
        }
        return `Investigate error handling in ${actionName}.`;
    }

    if (category === 'resource') {
        return `Check for memory leaks or unclosed resources in ${actionName}. Monitor resource usage closely.`;
    }

    return `Review code logic for ${actionName}.`;
}
