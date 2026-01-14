/**
 * Tests for Reporter
 */

import { toMarkdown } from '../src/reporter.js';
import type { AnalysisResult } from '../src/types.js';

describe('Reporter', () => {
    it('should generate markdown report', () => {
        const result: AnalysisResult = {
            generatedAt: Date.now(),
            summary: 'Executive Summary',
            insights: [
                {
                    id: '1',
                    title: 'High Latency',
                    description: 'Latency is too high',
                    severity: 'critical',
                    category: 'performance',
                    suggestion: 'Cache it',
                    relatedItems: [{ service: 'svc', function: 'fn' }]
                }
            ]
        };

        const md = toMarkdown(result);

        expect(md).toContain('# AI Analysis Report');
        expect(md).toContain('## Summary');
        expect(md).toContain('Executive Summary');
        expect(md).toContain('🔴 High Latency');
        expect(md).toContain('**Severity:** critical');
    });
});
