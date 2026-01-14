/**
 * Tests for Reporter
 */

import { generateReport } from '../src/reporter.js';
import type { AggregatedStats } from '../src/types.js';

function createStats(actionName: string, failures: number, historySize: number = 10): AggregatedStats {
    return {
        key: { service: 'svc', functionName: 'fn', actionName },
        totalExecutions: historySize,
        totalFailures: failures,
        totalDegradations: 0,
        firstSeen: 0,
        lastSeen: 0,
        avgDurationMs: 100,
        maxDurationMs: 100,
        avgCpuDelta: 0,
        maxCpuDelta: 0,
        avgMemoryDeltaMb: 0,
        maxMemoryDeltaMb: 0,
        errorCounts: failures > 0 ? { 'TestError': failures } : {},
        recentHistory: Array(historySize).fill({
            metrics: { durationMs: 100 },
            status: 'ok',
            anomalies: [],
            traceId: 't-1'
        }),
    };
}

describe('Reporter', () => {
    it('should generate report summary', () => {
        const statsList = [
            createStats('ActionA', 5), // 50% failures
            createStats('ActionB', 0),
        ];

        const report = generateReport(statsList);

        expect(report.summary.totalFunctions).toBe(2);
        expect(report.items.length).toBe(2);
    });

    it('should prioritize failing items', () => {
        const statsList = [
            createStats('ActionOK', 0),
            createStats('ActionFail', 10),
        ];

        const report = generateReport(statsList);

        expect(report.items[0].actionName).toBe('ActionFail');
    });

    it('should recommend ops attention for high failures', () => {
        const stats = createStats('CriticalAction', 5); // 5/10 = 50% failure rate
        const report = generateReport([stats]);

        expect(report.items[0].recommendedAttention).toBe('ops');
    });

    it('should identify most common error', () => {
        const stats = createStats('ErrorAction', 5);
        const report = generateReport([stats]);

        expect(report.items[0].mostCommonError).toBe('TestError');
    });
});
