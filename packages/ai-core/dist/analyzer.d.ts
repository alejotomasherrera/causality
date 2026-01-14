/**
 * @causality/ai-core — Analyzer
 *
 * Orchestrates the analysis process.
 */
import type { AIConfig, AnalysisInput, AnalysisResult } from './types.js';
/**
 * Main Analyzer class.
 */
export declare class Analyzer {
    private readonly adapter;
    constructor(config: AIConfig);
    /**
     * Run analysis on historical report.
     */
    analyze(input: AnalysisInput): Promise<AnalysisResult>;
}
//# sourceMappingURL=analyzer.d.ts.map