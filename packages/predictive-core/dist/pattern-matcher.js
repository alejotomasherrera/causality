/**
 * @causality/predictive-core — Pattern Matcher
 *
 * Identifies recurring anomalies and trends from historical data.
 */
/**
 * Match patterns in historical item.
 */
export function matchPatterns(item) {
    const patterns = [];
    // Trend: Latency Degradation
    if (item.trend === 'degrading') {
        patterns.push({
            type: 'trend',
            issue: 'latency_degradation',
            description: `Duration is degrading (avg: ${item.averageDuration}ms)`
        });
    }
    // Recurrence: Frequent Errors
    if (item.totalFailures > 2) { // Arbitrary threshold for recurrence
        patterns.push({
            type: 'recurrence',
            issue: 'frequent_failures',
            description: `Function failed ${item.totalFailures} times recently.`
        });
    }
    // Trend: Silent Degradation (implied by item.totalSilentDegradations if available or inferred)
    if (item.totalSilentDegradations > 0) {
        patterns.push({
            type: 'trend',
            issue: 'silent_resource_degradation',
            description: `Silent degradation detected (resources increasing without failures).`
        });
    }
    return patterns;
}
//# sourceMappingURL=pattern-matcher.js.map