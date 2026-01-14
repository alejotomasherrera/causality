/**
 * @causality/ai-core — Model Adapter
 *
 * Abstract interface and implementations for AI models.
 */
import type { AIConfig, ModelAdapter } from './types.js';
/**
 * Factory to create model adapters.
 */
export declare function createModelAdapter(config: AIConfig): ModelAdapter;
/**
 * Mock Model Adapter for testing and fallback.
 */
export declare class MockModelAdapter implements ModelAdapter {
    generate(prompt: string): Promise<string>;
}
//# sourceMappingURL=model-adapter.d.ts.map