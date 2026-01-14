/**
 * @causality/storage-core — Serializers
 *
 * JSON serialization and normalization for traces.
 */
import type { CausalityTrace, CausalityActionNode } from './types.js';
/**
 * Serialize a trace to JSON string.
 * Produces a single-line JSON suitable for JSONL format.
 */
export declare function serializeTrace(trace: CausalityTrace): string;
/**
 * Deserialize a JSON string to a trace.
 * Validates required fields.
 */
export declare function deserializeTrace(json: string): CausalityTrace;
/**
 * Extract all action names from a trace (recursive).
 */
export declare function extractActionNames(trace: CausalityTrace): Set<string>;
/**
 * Find action by name within a trace (first match).
 */
export declare function findAction(trace: CausalityTrace, actionName: string): CausalityActionNode | null;
/**
 * Find all actions matching a name within a trace.
 */
export declare function findAllActions(trace: CausalityTrace, actionName: string): CausalityActionNode[];
/**
 * Check if trace contains any action matching predicate.
 */
export declare function hasMatchingAction(trace: CausalityTrace, predicate: (action: CausalityActionNode) => boolean): boolean;
//# sourceMappingURL=serializers.d.ts.map