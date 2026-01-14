/**
 * @causality/collector-core — Type Definitions
 *
 * Types for causal trace reconstruction and collection.
 */

import type { ActionSnapshot, ActionEvent } from '@causality/sdk-core';

/**
 * Schema version for event compatibility.
 */
export const SCHEMA_VERSION = '1.0';

/**
 * A node in the causal action tree.
 * Represents a single action with its children.
 */
export interface CausalityActionNode {
  readonly id: string;
  readonly name: string;
  readonly parentId?: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly durationMs?: number;
  readonly status: 'ok' | 'error' | 'incomplete';
  readonly depth: number;
  readonly attributes?: Record<string, unknown>;
  readonly error?: {
    readonly message: string;
    readonly stack?: string;
  };
  readonly children: CausalityActionNode[];
}

/**
 * A complete causal trace reconstructed from events.
 */
export interface CausalityTrace {
  readonly traceId: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly durationMs?: number;
  readonly rootActions: CausalityActionNode[];
  readonly status: 'ok' | 'error' | 'partial';
  readonly actionCount: number;
  readonly maxDepth: number;
}

/**
 * Transport interface for sending traces to external systems.
 */
export interface CollectorTransport {
  /**
   * Send a reconstructed trace.
   * Implementations should be non-blocking.
   */
  send(trace: CausalityTrace): Promise<void>;

  /**
   * Optional cleanup when collector is stopped.
   */
  close?(): Promise<void>;
}

/**
 * Configuration for the collector.
 */
export interface CollectorConfig {
  /**
   * Interval in ms to flush buffered traces.
   * @default 5000
   */
  flushIntervalMs?: number;

  /**
   * Maximum events to buffer before forcing a flush.
   * @default 100
   */
  maxBufferSize?: number;

  /**
   * Time in ms to wait for a trace to complete before considering it partial.
   * @default 30000
   */
  traceTimeoutMs?: number;

  /**
   * Transport to send completed traces.
   */
  transport: CollectorTransport;
}

/**
 * Internal buffer entry for a trace being built.
 */
export interface TraceBuffer {
  traceId: string;
  events: ActionEvent[];
  firstEventTime: number;
  lastEventTime: number;
}

/**
 * Result of trace building.
 */
export interface TraceBuildResult {
  trace: CausalityTrace;
  warnings: string[];
}

/**
 * Collector handle returned by createCollector.
 */
export interface Collector {
  /**
   * Ingest an action event into the buffer.
   */
  ingest(event: ActionEvent): void;

  /**
   * Force flush all buffered traces.
   */
  flush(): Promise<void>;

  /**
   * Stop the collector and flush remaining traces.
   */
  stop(): Promise<void>;

  /**
   * Get current buffer statistics.
   */
  stats(): CollectorStats;
}

/**
 * Statistics about collector state.
 */
export interface CollectorStats {
  bufferedTraces: number;
  bufferedEvents: number;
  flushedTraces: number;
  flushedEvents: number;
}

// Re-export SDK types for convenience
export type { ActionSnapshot, ActionEvent };
