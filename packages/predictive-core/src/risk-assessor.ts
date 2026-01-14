/**
 * @causality/predictive-core — Risk Assessor
 *
 * Calculates severity and confidence of predictions.
 */

import type { HistoricalReportItem } from '@causality/historical-core';
import type { RiskCategory, RiskSeverity } from './types.js';
import type { Pattern } from './pattern-matcher.js';

/**
 * Assess risk based on item and matched patterns.
 */
export function assessRisk(item: HistoricalReportItem, patterns: Pattern[]): {
    severity: RiskSeverity;
    category: RiskCategory;
    confidence: number;
    expectedImpact: number;
} {
    let severity: RiskSeverity = 'low';
    let category: RiskCategory = 'performance';
    let confidence = 0.5;
    let expectedImpact = 10;

    const hasFailures = item.totalFailures > 0;
    const isDegrading = item.trend === 'degrading';
    const hasSilentDegradation = item.totalSilentDegradations > 0;

    // Determine Category
    if (hasFailures) category = 'reliability';
    else if (hasSilentDegradation) category = 'resource';
    else if (isDegrading) category = 'performance';
    else category = 'code';

    // Determine Severity & Impact
    if (hasFailures) {
        if (item.totalFailures > 5) {
            severity = 'critical';
            expectedImpact = 90;
            confidence = 0.95;
        } else {
            severity = 'high';
            expectedImpact = 70;
            confidence = 0.8;
        }
    } else if (hasSilentDegradation) {
        severity = 'medium'; // Silent issues are usually medium risk initially
        expectedImpact = 40;
        confidence = 0.7;
    } else if (isDegrading) {
        severity = 'medium';
        expectedImpact = 50;
        confidence = 0.6; // Trends can be noisy
    }

    // Boost confidence if multiple patterns match
    if (patterns.length > 1) {
        confidence = Math.min(0.99, confidence + 0.1);
        expectedImpact = Math.min(100, expectedImpact + 10);
    }

    // Boost severity if Ops attention recommended
    if (item.recommendedAttention === 'ops' && severity !== 'critical') {
        severity = 'high';
        expectedImpact = Math.max(80, expectedImpact);
    }

    return { severity, category, confidence, expectedImpact };
}
