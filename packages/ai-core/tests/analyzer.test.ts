/**
 * Tests for Analyzer
 */

import { Analyzer } from '../src/analyzer.js';
import type { AnalysisInput, HistoricalReport } from '../src/types.js';

describe('Analyzer', () => {
    let analyzer: Analyzer;

    beforeEach(() => {
        analyzer = new Analyzer({ provider: 'mock', model: 'test-model' });
    });

    it('should run analysis and return structured result', async () => {
        const mockReport: HistoricalReport = {
            generatedAt: Date.now(),
            items: [],
            summary: {
                totalServices: 1,
                totalFunctions: 1,
                criticalItems: 0
            }
        };

        const result = await analyzer.analyze({ report: mockReport });

        expect(result).toBeDefined();
        expect(result.summary).toContain('Analysis based on historical data');
        expect(result.insights.length).toBeGreaterThan(0);
        expect(result.insights[0].title).toBeDefined();
    });
});
