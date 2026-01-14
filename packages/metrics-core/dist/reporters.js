/**
 * @causality/metrics-core — Reporters
 *
 * Format and output metric findings.
 */
/**
 * Generate a findings report from a list of findings.
 */
export function generateReport(findings, traceId) {
    const bySeverity = {
        low: 0,
        medium: 0,
        high: 0,
    };
    const byType = {};
    for (const finding of findings) {
        bySeverity[finding.severity]++;
        byType[finding.type] = (byType[finding.type] || 0) + 1;
    }
    return {
        timestamp: Date.now(),
        traceId,
        summary: {
            total: findings.length,
            bySeverity,
            byType,
        },
        findings,
    };
}
/**
 * Format a single finding as a human-readable string.
 */
export function formatFinding(finding) {
    const severity = finding.severity.toUpperCase();
    return `[${severity}] ${finding.type}: ${finding.message}`;
}
/**
 * Format a report as text.
 */
export function formatReportText(report) {
    const lines = [];
    lines.push('=== Metrics Findings Report ===');
    lines.push(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
    if (report.traceId) {
        lines.push(`Trace: ${report.traceId}`);
    }
    lines.push('');
    lines.push(`Total findings: ${report.summary.total}`);
    lines.push(`  High: ${report.summary.bySeverity.high}`);
    lines.push(`  Medium: ${report.summary.bySeverity.medium}`);
    lines.push(`  Low: ${report.summary.bySeverity.low}`);
    lines.push('');
    if (report.findings.length > 0) {
        lines.push('Findings:');
        for (const finding of report.findings) {
            lines.push(`  - ${formatFinding(finding)}`);
        }
    }
    return lines.join('\n');
}
/**
 * Format a report as JSON.
 */
export function formatReportJson(report) {
    return JSON.stringify(report, null, 2);
}
/**
 * Group findings by trace.
 */
export function groupByTrace(findings) {
    const groups = new Map();
    for (const finding of findings) {
        const existing = groups.get(finding.traceId) || [];
        existing.push(finding);
        groups.set(finding.traceId, existing);
    }
    return groups;
}
/**
 * Group findings by action.
 */
export function groupByAction(findings) {
    const groups = new Map();
    for (const finding of findings) {
        const existing = groups.get(finding.actionName) || [];
        existing.push(finding);
        groups.set(finding.actionName, existing);
    }
    return groups;
}
/**
 * Filter findings by severity.
 */
export function filterBySeverity(findings, minSeverity) {
    const severityOrder = {
        low: 1,
        medium: 2,
        high: 3,
    };
    const minOrder = severityOrder[minSeverity];
    return findings.filter((f) => severityOrder[f.severity] >= minOrder);
}
/**
 * Sort findings by severity (high first).
 */
export function sortBySeverity(findings) {
    const severityOrder = {
        high: 3,
        medium: 2,
        low: 1,
    };
    return [...findings].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
}
/**
 * Console reporter - logs findings to console.
 */
export class ConsoleReporter {
    minSeverity;
    constructor(minSeverity = 'low') {
        this.minSeverity = minSeverity;
    }
    report(findings) {
        const filtered = filterBySeverity(findings, this.minSeverity);
        const sorted = sortBySeverity(filtered);
        for (const finding of sorted) {
            const formatted = formatFinding(finding);
            switch (finding.severity) {
                case 'high':
                    console.error(`[metrics] ${formatted}`);
                    break;
                case 'medium':
                    console.warn(`[metrics] ${formatted}`);
                    break;
                default:
                    console.log(`[metrics] ${formatted}`);
            }
        }
    }
}
/**
 * In-memory reporter - stores findings for testing.
 */
export class InMemoryReporter {
    findings = [];
    report(findings) {
        this.findings.push(...findings);
    }
    getFindings() {
        return [...this.findings];
    }
    getFindingsByType(type) {
        return this.findings.filter((f) => f.type === type);
    }
    getSilentDegradations() {
        return this.getFindingsByType('silent_degradation');
    }
    clear() {
        this.findings.length = 0;
    }
    count() {
        return this.findings.length;
    }
}
//# sourceMappingURL=reporters.js.map