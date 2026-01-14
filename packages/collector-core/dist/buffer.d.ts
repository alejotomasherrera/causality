/**
 * @causality/collector-core — In-Memory Buffer
 *
 * Buffers action events grouped by traceId until flush.
 */
import type { ActionEvent, TraceBuffer } from './types.js';
/**
 * In-memory buffer for collecting events by trace.
 */
export declare class EventBuffer {
    private readonly traces;
    private totalEvents;
    /**
     * Add an event to the buffer.
     */
    add(event: ActionEvent): void;
    /**
     * Get all trace IDs currently buffered.
     */
    getTraceIds(): string[];
    /**
     * Get a specific trace buffer.
     */
    getTrace(traceId: string): TraceBuffer | undefined;
    /**
     * Remove and return a trace buffer.
     */
    extractTrace(traceId: string): TraceBuffer | undefined;
    /**
     * Extract all traces that are ready for flush.
     * A trace is ready if:
     * - All actions have ended (no running actions)
     * - OR it has timed out
     */
    extractReadyTraces(timeoutMs: number): TraceBuffer[];
    /**
     * Extract all buffered traces (for forced flush).
     */
    extractAll(): TraceBuffer[];
    /**
     * Check if a trace has all actions completed.
     */
    private isTraceComplete;
    /**
     * Get buffer statistics.
     */
    stats(): {
        traceCount: number;
        eventCount: number;
    };
    /**
     * Check if buffer exceeds size limit.
     */
    exceedsSize(maxSize: number): boolean;
}
//# sourceMappingURL=buffer.d.ts.map