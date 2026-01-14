/**
 * @causality/reproducibility-core — Issue Classifier
 *
 * Classifies issues deterministically based on trace and findings.
 */
import type { CausalStep, MetricFinding, IssueType, IssueSeverity, CausalityTrace } from './types.js';
/**
 * Classify the issue type from trace and findings.
 */
export declare function classifyIssue(trace: CausalityTrace, steps: CausalStep[], findings: MetricFinding[]): IssueType;
/**
 * Calculate severity from findings and trace status.
 */
export declare function calculateSeverity(issueType: IssueType, steps: CausalStep[], findings: MetricFinding[]): IssueSeverity;
/**
 * Generate a human-readable summary of the issue.
 */
export declare function generateSummary(issueType: IssueType, severity: IssueSeverity, steps: CausalStep[], findings: MetricFinding[]): string;
/**
 * Get the root cause action (deterministic).
 */
export declare function getRootCauseAction(steps: CausalStep[], findings: MetricFinding[]): CausalStep | undefined;
//# sourceMappingURL=classifier.d.ts.map