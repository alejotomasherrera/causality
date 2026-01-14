/**
 * Tests for Pattern Matcher
 */

import { matchPatterns } from '../src/pattern-matcher.js';
import type { HistoricalReportItem } from '@causality/historical-core';

function createItem(overrides: Partial<HistoricalReportItem> = {}): HistoricalReportItem {
    return {
        microservice: 'svc',
        function: 'fn',
        actionName: 'act',
        totalFailures: 0,
        totalSilentDegradations: 0,
        averageDuration: 100,
        maxCpuDelta: 0,
        maxMemoryDelta: 0,
        mostCommonError: 'none',
        trend: 'stable',
        recommendedAttention: 'none',
        historicalTraces: [],
        ...overrides
    };
}

describe('Pattern Matcher', () => {
    it('should detect latency degradation', () => {
        const item = createItem({ trend: 'degrading' });
        const patterns = matchPatterns(item);
        
        expect(patterns).toHaveLength(1);
        expect(patterns[0].issue).toBe('latency_degradation');
    });

    it('should detect recurring failures', () => {
        const item = createItem({ totalFailures: 5 });
        const patterns = matchPatterns(item);
        
        expect(patterns).toHaveLength(1);
        expect(patterns[0].issue).toBe('frequent_failures');
    });

    it('should detect multiple patterns', () => {
        const item = createItem({ trend: 'degrading', totalFailures: 5 });
        const patterns = matchPatterns(item);
        
        expect(patterns).toHaveLength(2);
    });
});
