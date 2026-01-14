/**
 * Tests for Risk Assessor
 */

import { assessRisk } from '../src/risk-assessor.js';
import type { HistoricalReportItem } from '@causality/historical-core';
import type { Pattern } from '../src/pattern-matcher.js';

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

describe('Risk Assessor', () => {
    it('should assess critical risk for frequent failures', () => {
        const item = createItem({ totalFailures: 10 });
        const patterns: Pattern[] = [{ type: 'recurrence', issue: 'frequent_failures', description: '' }];
        
        const risk = assessRisk(item, patterns);
        
        expect(risk.severity).toBe('critical');
        expect(risk.confidence).toBeGreaterThan(0.9);
    });

    it('should assess medium risk for silent degradation', () => {
        const item = createItem({ totalSilentDegradations: 5 });
        const patterns: Pattern[] = [{ type: 'trend', issue: 'silent_resource_degradation', description: '' }];
        
        const risk = assessRisk(item, patterns);
        
        expect(risk.severity).toBe('medium');
        expect(risk.category).toBe('resource');
    });

    it('should boost confidence with multiple patterns', () => {
        const item = createItem({ totalFailures: 3, trend: 'degrading' });
        const patterns: Pattern[] = [
            { type: 'recurrence', issue: 'failure', description: '' },
            { type: 'trend', issue: 'degradation', description: '' }
        ];

        const risk = assessRisk(item, patterns);
        
        // Base confidence for failures < 5 is 0.8. Boost is +0.1 => 0.9.
        expect(risk.confidence).toBeGreaterThanOrEqual(0.9);
    });
});
