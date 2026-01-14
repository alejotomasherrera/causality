/**
 * Tests for Insight Generator
 */

import { parseModelOutput, generatePrompt } from '../src/insight-generator.js';
import type { HistoricalReport } from '../src/types.js';

describe('Insight Generator', () => {
    describe('parseModelOutput', () => {
        it('should parse valid JSON output', () => {
            const raw = JSON.stringify({
                summary: 'Test Summary',
                insights: []
            });
            const result = parseModelOutput(raw);
            expect(result.summary).toBe('Test Summary');
            expect(result.insights).toEqual([]);
        });

        it('should handle markdown code blocks', () => {
            const raw = "```json\n{\"summary\":\"Test\",\"insights\":[]}\n```";
            const result = parseModelOutput(raw);
            expect(result.summary).toBe('Test');
        });

        it('should return fallback on invalid JSON', () => {
            const result = parseModelOutput("invalid json");
            expect(result.summary).toContain('Failed to parse');
        });
    });

    describe('generatePrompt', () => {
        it('should generate prompt containing summary', () => {
            const report: HistoricalReport = {
                generatedAt: Date.now(),
                items: [],
                summary: {
                    totalServices: 1,
                    totalFunctions: 1,
                    criticalItems: 0
                }
            };
            
            const prompt = generatePrompt({ report });
            expect(prompt).toContain('Instruction');
            expect(prompt).toContain('Output MUST be valid JSON');
        });
    });
});
