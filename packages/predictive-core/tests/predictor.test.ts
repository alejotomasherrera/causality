/**
 * Tests for Predictor
 */

import { Predictor } from '../src/predictor.js';
import type { HistoricalReport } from '@causality/historical-core';
import type { PredictiveInput } from '../src/types.js';
import { jest } from '@jest/globals';

describe('Predictor', () => {
    let predictor: Predictor;

    beforeEach(() => {
        predictor = new Predictor();
    });

    it('should generate predictions for risky items', () => {
        const report: HistoricalReport = {
            generatedAt: Date.now(),
            summary: { totalServices: 1, totalFunctions: 1, criticalItems: 1 },
            items: [
                {
                    microservice: 'svc',
                    function: 'fn',
                    actionName: 'RiskyAction',
                    totalFailures: 10,
                    totalSilentDegradations: 0,
                    averageDuration: 100,
                    maxCpuDelta: 0,
                    maxMemoryDelta: 0,
                    mostCommonError: 'error',
                    trend: 'degrading',
                    recommendedAttention: 'ops',
                    historicalTraces: []
                }
            ]
        };

        const input: PredictiveInput = {
            historicalReport: report,
            behaviorMetrics: [],
            impactAssessments: [],
            codeContext: [{
                actionName: 'RiskyAction',
                file: 'src/risky.ts',
                function: 'fn',
                module: 'mod'
            }]
        };

        const result = predictor.predict(input);

        expect(result.predictions).toHaveLength(1);
        expect(result.predictions[0].riskLevel).toBe('critical'); // was severity
        expect(result.predictions[0].file).toBe('src/risky.ts');
        expect(result.summaryMarkdown).toContain('RiskyAction');
        expect(result.summaryMarkdown).toContain('🚨 High Risk');
    });

    it('should emit onPrediction events', () => {
        const spy = jest.fn();
        predictor.onPrediction(spy);

         const report: HistoricalReport = {
            generatedAt: Date.now(),
            summary: { totalServices: 1, totalFunctions: 1, criticalItems: 1 },
            items: [
                {
                    microservice: 'svc',
                    function: 'fn',
                    actionName: 'EventAction',
                    totalFailures: 10,
                    totalSilentDegradations: 0,
                    averageDuration: 100,
                    maxCpuDelta: 0,
                    maxMemoryDelta: 0,
                    mostCommonError: 'error',
                    trend: 'degrading',
                    recommendedAttention: 'ops',
                    historicalTraces: []
                }
            ]
        };

        const input: PredictiveInput = {
            historicalReport: report,
            behaviorMetrics: [],
            impactAssessments: [],
            codeContext: []
        };

        predictor.predict(input);

        expect(spy).toHaveBeenCalled();
        const prediction = spy.mock.calls[0][0] as any;
        expect(prediction.riskLevel).toBeDefined();
        expect(prediction.impactedService).toBe('svc');
        // Wait, PredictiveOutput from `types.ts` does NOT have actionName directly, 
        // it has `tracePattern: "issue actionName"`.
        // Let's check the type def I just wrote.
    });
});
