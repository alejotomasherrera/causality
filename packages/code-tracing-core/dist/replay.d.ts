/**
 * @causality/code-tracing-core — Replay Instructions
 *
 * Generate step-by-step instructions to reproduce issues.
 */
import type { ReproducibilityExplanation, PropagationStep, EnrichedReplayInstruction } from './types.js';
/**
 * Generate replay instructions from explanation and propagation.
 */
export declare function generateReplayInstructions(explanation: ReproducibilityExplanation, propagation: PropagationStep[], inputs: Record<string, unknown>): EnrichedReplayInstruction[];
/**
 * Format instructions as markdown.
 */
export declare function formatInstructionsAsMarkdown(instructions: EnrichedReplayInstruction[]): string;
//# sourceMappingURL=replay.d.ts.map