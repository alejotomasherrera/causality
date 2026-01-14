/**
 * @causality/ai-core — Model Adapter
 *
 * Abstract interface and implementations for AI models.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIConfig, ModelAdapter } from './types.js';

/**
 * Factory to create model adapters.
 */
export function createModelAdapter(config: AIConfig): ModelAdapter {
    switch (config.provider) {
        case 'mock':
            return new MockModelAdapter();
        case 'gemini':
            return new GeminiModelAdapter(config);
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
}

/**
 * Mock Model Adapter for testing and fallback.
 */
export class MockModelAdapter implements ModelAdapter {
    async generate(prompt: string): Promise<string> {
        return JSON.stringify({
            summary: "Analysis based on historical data indicates degrading performance in payment-service.",
            insights: [
                {
                    id: "insight-1",
                    title: "Latency Degradation in ProcessPayment",
                    description: "The function processPayment in payment-service shows a 30% increase in latency over the last 50 executions.",
                    severity: "high",
                    category: "performance",
                    suggestion: "Investigate recent changes in database queries or external API calls.",
                    relatedItems: [{ service: "payment-service", function: "processPayment" }]
                }
            ]
        }, null, 2);
    }
}

/**
 * Gemini Model Adapter.
 */
export class GeminiModelAdapter implements ModelAdapter {
    private genAI: GoogleGenerativeAI;
    private modelName: string;

    constructor(config: AIConfig) {
        if (!config.apiKey) {
            throw new Error('API Key is required for Gemini provider');
        }
        this.genAI = new GoogleGenerativeAI(config.apiKey);
        this.modelName = config.model || 'gemini-pro';
    }

    async generate(prompt: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini Generation Error:', error);
            throw error;
        }
    }
}
