/**
 * @causality/historical-core — Reporter
 *
 * Generates structured historical reports.
 */
import { analyzeTrend } from './trend-analyzer.js';
/**
 * Generate a full report from aggregated statistics.
 */
export function generateReport(statsList) {
    const items = statsList.map(stats => createReportItem(stats));
    // Sorting: Prioritize by total failures (desc) + total degradations
    items.sort((a, b) => {
        const scoreA = a.totalFailures * 10 + a.totalSilentDegradations * 5;
        const scoreB = b.totalFailures * 10 + b.totalSilentDegradations * 5;
        return scoreB - scoreA;
    });
    const totalServices = new Set(items.map(i => i.microservice)).size;
    const criticalItems = items.filter(i => i.recommendedAttention === 'developer' || i.recommendedAttention === 'ops').length;
    return {
        generatedAt: Date.now(),
        items,
        summary: {
            totalServices,
            totalFunctions: items.length,
            criticalItems,
        },
    };
}
/**
 * Create a single report item.
 */
function createReportItem(stats) {
    const trend = analyzeTrend(stats);
    const mostCommonError = getMostCommonError(stats.errorCounts);
    const recommendedAttention = recommendAttention(stats, trend);
    return {
        microservice: stats.key.service,
        function: stats.key.functionName,
        actionName: stats.key.actionName,
        totalFailures: stats.totalFailures,
        totalSilentDegradations: stats.totalDegradations, // Mapping degradations roughly
        averageDuration: Math.round(stats.avgDurationMs),
        maxCpuDelta: Math.round(stats.maxCpuDelta),
        maxMemoryDelta: Math.round(stats.maxMemoryDeltaMb),
        mostCommonError: mostCommonError ?? 'None',
        trend: trend.durationTrend === 'degrading' || trend.errorTrend === 'degrading' ? 'degrading' : trend.durationTrend,
        recommendedAttention,
        historicalTraces: stats.recentHistory.map(r => r.traceId),
    };
}
/**
 * Find most frequent error.
 */
function getMostCommonError(counts) {
    let max = 0;
    let common;
    for (const [error, count] of Object.entries(counts)) {
        if (count > max) {
            max = count;
            common = error;
        }
    }
    return common;
}
/**
 * Logic to recommend attention level.
 */
function recommendAttention(stats, trend) {
    const total = stats.totalExecutions;
    if (total === 0)
        return 'none';
    const failureRate = stats.totalFailures / total;
    // CRITICAL cases requiring Ops/Dev attention
    if (failureRate > 0.1) { // >10% failure rate
        return 'ops'; // Immediate operational concern
    }
    if (trend.isSilentDegradation || trend.durationTrend === 'degrading') {
        return 'developer'; // Logic or optimization issue
    }
    if (stats.totalDegradations / total > 0.2) { // >20% degraded
        return 'product'; // UX might be suffering
    }
    return 'none';
}
//# sourceMappingURL=reporter.js.map