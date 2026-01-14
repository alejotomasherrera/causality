/**
 * @causality/storage-core
 *
 * Storage and query layer for causal traces.
 *
 * @example
 * import { InMemoryStorage, TraceRepository } from '@causality/storage-core';
 *
 * const storage = new InMemoryStorage();
 * const repo = new TraceRepository(storage);
 *
 * // Save traces
 * await storage.save(trace);
 *
 * // Query
 * const failed = await repo.findFailed();
 * const slow = await repo.findSlow(500);
 *
 * @packageDocumentation
 */
// Storage implementations
export { InMemoryStorage } from './implementations/memory.js';
export { JSONLStorage } from './implementations/jsonl.js';
// Query
export { TraceRepository } from './repository.js';
// Indexing
export { TraceIndex } from './indexes.js';
// Serialization
export { serializeTrace, deserializeTrace, extractActionNames, findAction, findAllActions, hasMatchingAction, } from './serializers.js';
//# sourceMappingURL=index.js.map