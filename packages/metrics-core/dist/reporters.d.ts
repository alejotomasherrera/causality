/**
 * @causality/metrics-core — Reporters
 *
 * Format and output metric findings.
 */
import type { MetricFinding, FindingSeverity } from './types.js';
/**
 * Report format for findings.
 */
export interface FindingsReport {
    readonly timestamp: number;
    readonly traceId?: string;
    readonly summary: {
        readonly total: number;
        readonly bySeverity: Record<FindingSeverity, number>;
        readonly byType: Record<string, number>;
    };
    readonly findings: MetricFinding[];
}
/**
 * Generate a findings report from a list of findings.
 */
export declare function generateReport(findings: MetricFinding[], traceId?: string): FindingsReport;
/**
 * Format a single finding as a human-readable string.
 */
export declare function formatFinding(finding: MetricFinding): string;
/**
 * Format a report as text.
 */
export declare function formatReportText(report: FindingsReport): string;
/**
 * Format a report as JSON.
 */
export declare function formatReportJson(report: FindingsReport): string;
/**
 * Group findings by trace.
 */
export declare function groupByTrace(findings: MetricFinding[]): Map<string, MetricFinding[]>;
/**
 * Group findings by action.
 */
export declare function groupByAction(findings: MetricFinding[]): Map<string, MetricFinding[]>;
/**
 * Filter findings by severity.
 */
export declare function filterBySeverity(findings: MetricFinding[], minSeverity: FindingSeverity): MetricFinding[];
/**
 * Sort findings by severity (high first).
 */
export declare function sortBySeverity(findings: MetricFinding[]): MetricFinding[];
/**
 * Console reporter - logs findings to console.
 */
export declare class ConsoleReporter {
    private readonly minSeverity;
    constructor(minSeverity?: FindingSeverity);
    report(findings: MetricFinding[]): void;
}
/**
 * In-memory reporter - stores findings for testing.
 */
export declare class InMemoryReporter {
    private readonly findings;
    report(findings: MetricFinding[]): void;
    getFindings(): MetricFinding[];
    getFindingsByType(type: string): MetricFinding[];
    getSilentDegradations(): MetricFinding[];
    clear(): void;
    count(): number;
}
//# sourceMappingURL=reporters.d.ts.map