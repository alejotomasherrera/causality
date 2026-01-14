/**
 * @causality/collector-core — Collector
 *
 * Main collector orchestration: ingest → buffer → build → flush.
 */
import type { Collector, CollectorConfig } from './types.js';
/**
 * Create a new collector instance.
 *
 * @example
 * const collector = createCollector({
 *   flushIntervalMs: 2000,
 *   transport: new ConsoleTransport()
 * });
 *
 * onActionEvent(event => collector.ingest(event));
 */
export declare function createCollector(config: CollectorConfig): Collector;
//# sourceMappingURL=collector.d.ts.map