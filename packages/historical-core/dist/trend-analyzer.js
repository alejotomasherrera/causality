/**
 * @causality/historical-core — Trend Analyzer
 *
 * Analyzes aggregated statistics to detect trends and patterns.
 */
/**
 * Analyze trends for a specific aggregation.
 */
export function analyzeTrend(stats, minExecutions = 5) {
    if (stats.recentHistory.length < minExecutions) {
        return {
            durationTrend: 'unknown',
            errorTrend: 'unknown',
            stabilityScore: 100, // Assume stable until proven otherwise
            frequentAnomalies: [],
            isSilentDegradation: false,
        };
    }
    const durationTrend = calculateMetricTrend(stats.recentHistory.map(r => r.metrics.durationMs));
    const errorTrend = calculateErrorTrend(stats.recentHistory);
    const stabilityScore = calculateStabilityScore(stats);
    const frequentAnomalies = identifyFrequentAnomalies(stats);
    const isSilentDegradation = detectSilentDegradation(stats, durationTrend);
    return {
        durationTrend,
        errorTrend,
        stabilityScore,
        frequentAnomalies,
        isSilentDegradation,
    };
}
/**
 * Calculate trend direction for a numeric metric (e.g., duration).
 * Uses a simple linear regression slope or comparison of halves.
 */
function calculateMetricTrend(values) {
    if (values.length < 2)
        return 'unknown';
    // Split into two halves
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);
    const firstAvg = average(firstHalf);
    const secondAvg = average(secondHalf);
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    if (percentChange > 20)
        return 'degrading'; // Significant increase (>20%)
    if (percentChange < -20)
        return 'improving'; // Significant decrease (>20%)
    return 'stable';
}
/**
 * Calculate trend for errors/status.
 */
function calculateErrorTrend(history) {
    if (history.length < 2)
        return 'unknown';
    const mid = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, mid);
    const secondHalf = history.slice(mid);
    const firstErrorRate = calculateErrorRate(firstHalf);
    const secondErrorRate = calculateErrorRate(secondHalf);
    if (secondErrorRate > firstErrorRate + 0.1)
        return 'degrading'; // 10% increase in error rate
    if (secondErrorRate < firstErrorRate - 0.1)
        return 'improving';
    return 'stable';
}
/**
 * Calculate stability score (0-100).
 */
function calculateStabilityScore(stats) {
    const total = stats.totalExecutions;
    if (total === 0)
        return 100;
    const failureRate = stats.totalFailures / total;
    const degradationRate = stats.totalDegradations / total;
    // Weight failures more heavily than degradations
    const penalty = (failureRate * 50) + (degradationRate * 25);
    return Math.max(0, 100 - penalty);
}
/**
 * Identify most frequent anomalies.
 */
function identifyFrequentAnomalies(stats) {
    const anomalyCounts = new Map();
    for (const record of stats.recentHistory) {
        for (const anomaly of record.anomalies) {
            anomalyCounts.set(anomaly, (anomalyCounts.get(anomaly) || 0) + 1);
        }
    }
    // Filter anomalies appearing in > 20% of recent history
    const threshold = stats.recentHistory.length * 0.2;
    const freq = [];
    for (const [anomaly, count] of anomalyCounts.entries()) {
        if (count >= threshold) {
            freq.push(anomaly);
        }
    }
    return freq;
}
/**
 * Detect silent degradation (stable success but worsening performance/resource usage).
 */
function detectSilentDegradation(stats, durationTrend) {
    const recentFailures = stats.recentHistory.filter(r => r.status === 'error').length;
    const recentTotal = stats.recentHistory.length;
    // If error rate is low (< 5%) but duration is degrading
    if (recentFailures / recentTotal < 0.05 && durationTrend === 'degrading') {
        return true;
    }
    return false;
}
// Helpers
function average(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}
function calculateErrorRate(records) {
    if (records.length === 0)
        return 0;
    const errors = records.filter(r => r.status === 'error').length;
    return errors / records.length;
}
//# sourceMappingURL=trend-analyzer.js.map