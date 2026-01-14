/**
 * @causality/ai-core — Model Adapter
 *
 * Abstract interface and implementations for AI models.
 */
/**
 * Factory to create model adapters.
 */
export function createModelAdapter(config) {
    switch (config.provider) {
        case 'mock':
            return new MockModelAdapter();
        // Future: Add 'openai', 'gemini', 'ollama'
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
}
/**
 * Mock Model Adapter for testing and fallback.
 */
export class MockModelAdapter {
    async generate(prompt) {
        // Return a canned JSON response simulating an analysis
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
                },
                {
                    id: "insight-2",
                    title: "Silent Degradation in UserProfile",
                    description: "Memory usage is increasing despite successful executions.",
                    severity: "medium",
                    category: "reliability",
                    suggestion: "Check for memory leaks in the profile caching mechanism.",
                    relatedItems: [{ service: "user-service", function: "getUserProfile" }]
                }
            ]
        }, null, 2);
    }
}
//# sourceMappingURL=model-adapter.js.map