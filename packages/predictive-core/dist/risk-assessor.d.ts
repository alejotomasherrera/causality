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
export declare function assessRisk(item: HistoricalReportItem, patterns: Pattern[]): {
    severity: RiskSeverity;
    category: RiskCategory;
    confidence: number;
    expectedImpact: number;
};
//# sourceMappingURL=risk-assessor.d.ts.map