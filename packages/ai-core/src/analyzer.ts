/**
 * @causality/ai-core — Analyzer
 *
 * Orchestrates the analysis process.
 */

import { createModelAdapter } from './model-adapter.js';
import { generatePrompt, parseModelOutput } from './insight-generator.js';
import type { AIConfig, AnalysisInput, AnalysisResult, ModelAdapter } from './types.js';

/**
 * Main Analyzer class.
 */
export class Analyzer {
    private readonly adapter: ModelAdapter;

    constructor(config: AIConfig) {
        this.adapter = createModelAdapter(config);
    }

    /**
     * Run analysis on historical report.
     */
    async analyze(input: AnalysisInput): Promise<AnalysisResult> {
        const prompt = generatePrompt(input);
        
        try {
            const rawOutput = await this.adapter.generate(prompt);
            return parseModelOutput(rawOutput);
        } catch (error) {
            console.error("AI Analysis failed:", error);
            throw error;
        }
    }
}
