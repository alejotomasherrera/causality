/**
 * @causality/collector-core
 *
 * Collector for buffering, reconstructing, and flushing causal traces.
 *
 * @example
 * import { onActionEvent } from '@causality/sdk-core';
 * import { createCollector, ConsoleTransport } from '@causality/collector-core';
 *
 * const collector = createCollector({
 *   flushIntervalMs: 2000,
 *   transport: new ConsoleTransport()
 * });
 *
 * onActionEvent(event => collector.ingest(event));
 *
 * @packageDocumentation
 */
export { createCollector } from './collector.js';
export { buildTrace } from './trace-builder.js';
export { EventBuffer } from './buffer.js';
export { ConsoleTransport, InMemoryTransport, FileTransport, MultiTransport, NullTransport, } from './transport.js';
export type { CausalityTrace, CausalityActionNode, CollectorTransport, CollectorConfig, Collector, CollectorStats, TraceBuffer, TraceBuildResult, ActionSnapshot, ActionEvent, } from './types.js';
export { SCHEMA_VERSION } from './types.js';
//# sourceMappingURL=index.d.ts.map