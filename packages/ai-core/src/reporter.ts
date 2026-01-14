/**
 * @causality/ai-core — Reporter
 *
 * Format analysis results.
 */

import type { AnalysisResult } from './types.js';

/**
 * Format analysis result as Markdown.
 */
export function toMarkdown(result: AnalysisResult): string {
    const lines: string[] = [];

    lines.push(`# AI Analysis Report`);
    lines.push(`Generated at: ${new Date(result.generatedAt).toISOString()}`);
    lines.push(`\n## Summary`);
    lines.push(result.summary);

    lines.push(`\n## Insights`);
    
    if (result.insights.length === 0) {
        lines.push(`No critical insights found.`);
    }

    for (const insight of result.insights) {
        const icon = getSeverityIcon(insight.severity);
        lines.push(`\n### ${icon} ${insight.title}`);
        lines.push(`**Severity:** ${insight.severity} | **Category:** ${insight.category}`);
        lines.push(`\n${insight.description}`);
        lines.push(`\n> **Suggestion:** ${insight.suggestion}`);
        
        if (insight.relatedItems.length > 0) {
            lines.push(`\n*Related:* ${insight.relatedItems.map(i => `\`${i.service}::${i.function}\``).join(', ')}`);
        }
    }

    return lines.join('\n');
}

function getSeverityIcon(severity: string): string {
    switch (severity) {
        case 'critical': return '🔴';
        case 'high': return '🟠';
        case 'medium': return '🟡';
        case 'low': return '🔵';
        default: return '⚪';
    }
}
