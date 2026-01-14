/**
 * Tests for Trend Analyzer
 */

import { analyzeTrend } from '../src/trend-analyzer.js';
import type { AggregatedStats } from '../src/types.js';

function createMockStats(durations: number[], failures: number = 0): AggregatedStats {
    const history = durationToHistory(durations, failures);
    return {
        key: { service: 's', functionName: 'f', actionName: 'a' },
        totalExecutions: durations.length,
        totalFailures: failures,
        totalDegradations: 0,
        firstSeen: 0,
        lastSeen: 100,
        avgDurationMs: 100,
        maxDurationMs: Math.max(...durations),
        avgCpuDelta: 0,
        maxCpuDelta: 0,
        avgMemoryDeltaMb: 0,
        maxMemoryDeltaMb: 0,
        errorCounts: {},
        recentHistory: history,
    };
}

function durationToHistory(durations: number[], failureCount: number): any[] {
    return durations.map((d, i) => ({
        metrics: { durationMs: d },
        status: i < failureCount ? 'error' : 'ok',
        anomalies: [],
    }));
}

describe('Trend Analyzer', () => {
    it('should detect degrading duration trend', () => {
        // [100, 100, 100, 200, 200, 200] -> significant increase
        const stats = createMockStats([100, 100, 100, 200, 200, 200]);
        const trend = analyzeTrend(stats);
        
        expect(trend.durationTrend).toBe('degrading');
    });

    it('should detect improving duration trend', () => {
        // [200, 200, 200, 100, 100, 100] -> significant decrease
        const stats = createMockStats([200, 200, 200, 100, 100, 100]);
        const trend = analyzeTrend(stats);
        
        expect(trend.durationTrend).toBe('improving');
    });

    it('should detect stable trend', () => {
        const stats = createMockStats([100, 105, 95, 102, 98, 100]);
        const trend = analyzeTrend(stats);
        
        expect(trend.durationTrend).toBe('stable');
    });

    it('should detect silent degradation', () => {
        // No failures, but degrading duration
        const stats = createMockStats([100, 100, 100, 300, 300, 300], 0);
        const trend = analyzeTrend(stats);

        expect(trend.durationTrend).toBe('degrading');
        expect(trend.isSilentDegradation).toBe(true);
    });

    it('should return unknown for insufficient data', () => {
        const stats = createMockStats([100]);
        const trend = analyzeTrend(stats, 5);
        
        expect(trend.durationTrend).toBe('unknown');
    });
});
