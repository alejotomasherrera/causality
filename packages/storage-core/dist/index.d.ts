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
export { InMemoryStorage } from './implementations/memory.js';
export { JSONLStorage } from './implementations/jsonl.js';
export { TraceRepository } from './repository.js';
export { TraceIndex } from './indexes.js';
export { serializeTrace, deserializeTrace, extractActionNames, findAction, findAllActions, hasMatchingAction, } from './serializers.js';
export type { CausalityTrace, CausalityActionNode, TraceStorage, TraceQuery, CombinedQuery, ActionQuery, TraceRepository as ITraceRepository, TraceIndexEntry, StorageStats, } from './types.js';
//# sourceMappingURL=index.d.ts.map