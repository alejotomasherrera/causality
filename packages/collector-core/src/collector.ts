/**
 * @causality/collector-core — Collector
 *
 * Main collector orchestration: ingest → buffer → build → flush.
 */

import type {
  ActionEvent,
  Collector,
  CollectorConfig,
  CollectorStats,
} from './types.js';
import { EventBuffer } from './buffer.js';
import { buildTrace } from './trace-builder.js';

/**
 * Default configuration values.
 */
const DEFAULTS = {
  flushIntervalMs: 5000,
  maxBufferSize: 100,
  traceTimeoutMs: 30000,
} as const;

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
export function createCollector(config: CollectorConfig): Collector {
  const flushIntervalMs = config.flushIntervalMs ?? DEFAULTS.flushIntervalMs;
  const maxBufferSize = config.maxBufferSize ?? DEFAULTS.maxBufferSize;
  const traceTimeoutMs = config.traceTimeoutMs ?? DEFAULTS.traceTimeoutMs;
  const transport = config.transport;

  const buffer = new EventBuffer();
  let flushTimer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;
  let flushedTraces = 0;
  let flushedEvents = 0;

  // Start periodic flush timer
  flushTimer = setInterval(() => {
    flushReadyTraces().catch((err) => {
      console.error('[causality] Flush error:', err);
    });
  }, flushIntervalMs);

  /**
   * Flush traces that are ready (complete or timed out).
   */
  async function flushReadyTraces(): Promise<void> {
    if (stopped) return;

    const readyBuffers = buffer.extractReadyTraces(traceTimeoutMs);

    for (const traceBuffer of readyBuffers) {
      try {
        const { trace, warnings } = buildTrace(traceBuffer);

        if (warnings.length > 0) {
          console.warn(
            `[causality] Trace ${trace.traceId} warnings:`,
            warnings
          );
        }

        await transport.send(trace);

        flushedTraces++;
        flushedEvents += traceBuffer.events.length;
      } catch (err) {
        console.error(
          `[causality] Failed to flush trace ${traceBuffer.traceId}:`,
          err
        );
      }
    }
  }

  /**
   * Force flush all buffered traces.
   */
  async function flushAll(): Promise<void> {
    const allBuffers = buffer.extractAll();

    for (const traceBuffer of allBuffers) {
      try {
        const { trace, warnings } = buildTrace(traceBuffer);

        if (warnings.length > 0) {
          console.warn(
            `[causality] Trace ${trace.traceId} warnings:`,
            warnings
          );
        }

        await transport.send(trace);

        flushedTraces++;
        flushedEvents += traceBuffer.events.length;
      } catch (err) {
        console.error(
          `[causality] Failed to flush trace ${traceBuffer.traceId}:`,
          err
        );
      }
    }
  }

  return {
    ingest(event: ActionEvent): void {
      if (stopped) {
        console.warn('[causality] Collector stopped, ignoring event');
        return;
      }

      buffer.add(event);

      // Check if we need to force flush due to size
      if (buffer.exceedsSize(maxBufferSize)) {
        flushReadyTraces().catch((err) => {
          console.error('[causality] Size-triggered flush error:', err);
        });
      }
    },

    async flush(): Promise<void> {
      await flushAll();
    },

    async stop(): Promise<void> {
      stopped = true;

      if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
      }

      // Flush remaining traces
      await flushAll();

      // Close transport if supported
      await transport.close?.();
    },

    stats(): CollectorStats {
      const { traceCount, eventCount } = buffer.stats();
      return {
        bufferedTraces: traceCount,
        bufferedEvents: eventCount,
        flushedTraces,
        flushedEvents,
      };
    },
  };
}
