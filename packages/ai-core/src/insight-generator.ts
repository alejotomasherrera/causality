/**
 * @causality/ai-core — Insight Generator
 *
 * Generates structured insights from raw model output.
 */

import type { AnalysisResult, Insight } from './types.js';

/**
 * Parse and validate the model output.
 */
export function parseModelOutput(rawOutput: string): AnalysisResult {
    try {
        // Clean markdown code blocks if present (e.g., ```json ... ```)
        const cleanJson = rawOutput.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (!validateStructure(parsed)) {
            throw new Error("Invalid model output structure");
        }

        return {
            generatedAt: Date.now(),
            insights: parsed.insights,
            summary: parsed.summary,
            rawOutput: rawOutput // keep raw output for debug
        };
    } catch (error) {
        // Fallback or rethrow
        return {
            generatedAt: Date.now(),
            insights: [],
            summary: "Failed to parse AI model output.",
            rawOutput: rawOutput
        };
    }
}

function validateStructure(data: any): data is { insights: Insight[], summary: string } {
    return (
        typeof data === 'object' &&
        data !== null &&
        Array.isArray(data.insights) &&
        typeof data.summary === 'string'
    );
}

/**
 * Generate a prompt for the model based on historical report.
 */
export function generatePrompt(input: import('./types.js').AnalysisInput): string {
    const { report, context } = input;
    
    // Filter critical items to keep prompt concise
    const criticalItems = report.items.filter(i => 
        i.trend === 'degrading' || 
        i.totalFailures > 0 || 
        i.recommendedAttention !== 'none'
    );

    const summaryData = {
        summary: report.summary,
        criticalIssues: criticalItems
    };

    return `
You are an expert Site Reliability Engineer (SRE) and System Architect.
Analyze the following historical data statistics from the 'Causality' framework.
Generate actionable insights focusing on performance degradation, reliability issues, and architectural improvements.

Context: ${context ?? 'No specific context provided.'}

Historical Data (JSON):
${JSON.stringify(summaryData, null, 2)}

Instructions:
1. Identify the most critical issues.
2. Provide specific suggestions for remediation.
3. Categorize each insight.
4. Output MUST be valid JSON with the following structure:
{
  "summary": "Brief executive summary of system health",
  "insights": [
    {
      "id": "unique-id",
      "title": "Short title",
      "description": "Detailed explanation",
      "severity": "low|medium|high|critical",
      "category": "performance|reliability|security|architecture",
      "suggestion": "Actionable advice",
      "relatedItems": [{ "service": "name", "function": "name" }]
    }
  ]
}
`.trim();
}
