/**
 * @causality/predictive-core — Predictor
 *
 * Orchestrates predictive analysis.
 */
import type { PredictiveOutput, PredictiveInput, PredictiveReport } from './types.js';
type PredictionCallback = (prediction: PredictiveOutput) => void;
export declare class Predictor {
    private listeners;
    /**
     * Register a callback for new predictions.
     */
    onPrediction(callback: PredictionCallback): void;
    /**
     * Run predictive analysis based on historical input.
     */
    predict(input: PredictiveInput): PredictiveReport;
    private emitPrediction;
    private generateSummary;
}
export {};
//# sourceMappingURL=predictor.d.ts.map