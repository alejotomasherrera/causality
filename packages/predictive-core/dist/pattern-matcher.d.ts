/**
 * @causality/predictive-core — Pattern Matcher
 *
 * Identifies recurring anomalies and trends from historical data.
 */
import type { HistoricalReportItem } from '@causality/historical-core';
export interface Pattern {
    type: 'trend' | 'recurrence';
    issue: string;
    description: string;
}
/**
 * Match patterns in historical item.
 */
export declare function matchPatterns(item: HistoricalReportItem): Pattern[];
//# sourceMappingURL=pattern-matcher.d.ts.map