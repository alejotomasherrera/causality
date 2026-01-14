/**
 * @causality/ai-core — Insight Generator
 *
 * Generates structured insights from raw model output.
 */
import type { AnalysisResult } from './types.js';
/**
 * Parse and validate the model output.
 */
export declare function parseModelOutput(rawOutput: string): AnalysisResult;
/**
 * Generate a prompt for the model based on historical report.
 */
export declare function generatePrompt(input: import('./types.js').AnalysisInput): string;
//# sourceMappingURL=insight-generator.d.ts.map