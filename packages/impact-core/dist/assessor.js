/**
 * @causality/impact-core — Impact Assessor
 *
 * Combines scoring, audience, and policy into a complete assessment.
 */
import { calculateImpactScore, extractIssueCategory, detectImpactScope, } from './scoring.js';
import { classifyAudience } from './audience.js';
import { determinePolicy, shouldSurface } from './policy.js';
/**
 * Assess the impact of a reproducibility explanation.
 */
export function assessImpact(explanation, frequency, config) {
    // Extract category and scope
    const category = extractIssueCategory(explanation);
    const scope = detectImpactScope(explanation, config?.actionPatterns);
    // Calculate score
    const score = calculateImpactScore(explanation, frequency, config?.scoring);
    // Classify audience
    const audience = classifyAudience(explanation, category, scope);
    // Determine policy
    const policy = determinePolicy(score, audience, config?.policy);
    // Generate summary
    const summary = generateAssessmentSummary(explanation, score, audience, policy);
    // Deterministic ID
    const id = `impact-${explanation.traceId.slice(0, 8)}`;
    return {
        id,
        traceId: explanation.traceId,
        assessedAt: Date.now(),
        category,
        scope,
        score,
        audience,
        policy,
        summary,
        shouldNotify: shouldSurface(policy),
        explanation,
    };
}
/**
 * Generate assessment summary.
 */
function generateAssessmentSummary(explanation, score, audience, policy) {
    const parts = [];
    // Issue type
    parts.push(`${explanation.issueType.replace('_', ' ')}`);
    // Failure point
    if (explanation.failurePoint) {
        parts.push(`in "${explanation.failurePoint.name}"`);
    }
    // Score and priority
    parts.push(`(impact: ${score.total}, ${score.priority})`);
    // Action
    parts.push(`→ ${policy.action}`);
    // Audience
    if (audience.primary !== 'none') {
        parts.push(`to ${audience.primary}`);
    }
    return parts.join(' ');
}
/**
 * Impact Assessor class for stateful usage.
 */
export class ImpactAssessor {
    config;
    constructor(config) {
        this.config = config ?? {};
    }
    /**
     * Assess a single explanation.
     */
    assess(explanation, frequency) {
        return assessImpact(explanation, frequency, this.config);
    }
    /**
     * Assess with default frequency (single occurrence).
     */
    assessSingle(explanation) {
        return this.assess(explanation, {
            occurrences: 1,
            windowMs: 60000,
            affectedPercentage: 0,
        });
    }
    /**
     * Filter assessments that should notify.
     */
    filterNotifiable(assessments) {
        return assessments.filter((a) => a.shouldNotify);
    }
    /**
     * Filter by priority.
     */
    filterByPriority(assessments, minPriority) {
        const priorityOrder = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
            none: 0,
        };
        const minOrder = priorityOrder[minPriority] ?? 0;
        return assessments.filter((a) => priorityOrder[a.score.priority] >= minOrder);
    }
    /**
     * Filter by audience.
     */
    filterByAudience(assessments, audience) {
        return assessments.filter((a) => a.audience.primary === audience ||
            a.audience.secondary.includes(audience));
    }
    /**
     * Group assessments by action.
     */
    groupByAction(assessments) {
        const groups = new Map();
        for (const assessment of assessments) {
            const existing = groups.get(assessment.policy.action) ?? [];
            existing.push(assessment);
            groups.set(assessment.policy.action, existing);
        }
        return groups;
    }
    /**
     * Get statistics for a set of assessments.
     */
    getStats(assessments) {
        const byAction = {
            alert: 0,
            batch: 0,
            store: 0,
            ignore: 0,
        };
        const byPriority = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            none: 0,
        };
        const byAudience = {
            developer: 0,
            product: 0,
            ops: 0,
            none: 0,
        };
        let scoreSum = 0;
        for (const a of assessments) {
            byAction[a.policy.action]++;
            byPriority[a.score.priority]++;
            byAudience[a.audience.primary]++;
            scoreSum += a.score.total;
        }
        return {
            total: assessments.length,
            shouldNotify: assessments.filter((a) => a.shouldNotify).length,
            byAction,
            byPriority,
            byAudience,
            averageScore: assessments.length > 0 ? scoreSum / assessments.length : 0,
        };
    }
}
//# sourceMappingURL=assessor.js.map