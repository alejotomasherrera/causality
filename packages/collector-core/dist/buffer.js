/**
 * @causality/collector-core — In-Memory Buffer
 *
 * Buffers action events grouped by traceId until flush.
 */
/**
 * In-memory buffer for collecting events by trace.
 */
export class EventBuffer {
    traces = new Map();
    totalEvents = 0;
    /**
     * Add an event to the buffer.
     */
    add(event) {
        const traceId = event.action.traceId;
        const now = Date.now();
        let buffer = this.traces.get(traceId);
        if (!buffer) {
            buffer = {
                traceId,
                events: [],
                firstEventTime: now,
                lastEventTime: now,
            };
            this.traces.set(traceId, buffer);
        }
        buffer.events.push(event);
        buffer.lastEventTime = now;
        this.totalEvents++;
    }
    /**
     * Get all trace IDs currently buffered.
     */
    getTraceIds() {
        return Array.from(this.traces.keys());
    }
    /**
     * Get a specific trace buffer.
     */
    getTrace(traceId) {
        return this.traces.get(traceId);
    }
    /**
     * Remove and return a trace buffer.
     */
    extractTrace(traceId) {
        const buffer = this.traces.get(traceId);
        if (buffer) {
            this.traces.delete(traceId);
            this.totalEvents -= buffer.events.length;
        }
        return buffer;
    }
    /**
     * Extract all traces that are ready for flush.
     * A trace is ready if:
     * - All actions have ended (no running actions)
     * - OR it has timed out
     */
    extractReadyTraces(timeoutMs) {
        const now = Date.now();
        const ready = [];
        for (const [traceId, buffer] of this.traces) {
            const isComplete = this.isTraceComplete(buffer);
            const isTimedOut = now - buffer.lastEventTime > timeoutMs;
            if (isComplete || isTimedOut) {
                ready.push(buffer);
                this.traces.delete(traceId);
                this.totalEvents -= buffer.events.length;
            }
        }
        return ready;
    }
    /**
     * Extract all buffered traces (for forced flush).
     */
    extractAll() {
        const all = Array.from(this.traces.values());
        const eventCount = this.totalEvents;
        this.traces.clear();
        this.totalEvents = 0;
        return all;
    }
    /**
     * Check if a trace has all actions completed.
     */
    isTraceComplete(buffer) {
        const startedIds = new Set();
        const endedIds = new Set();
        for (const event of buffer.events) {
            if (event.type === 'action.start') {
                startedIds.add(event.action.id);
            }
            else if (event.type === 'action.end') {
                endedIds.add(event.action.id);
            }
        }
        // Complete if all started actions have ended
        for (const id of startedIds) {
            if (!endedIds.has(id)) {
                return false;
            }
        }
        return startedIds.size > 0;
    }
    /**
     * Get buffer statistics.
     */
    stats() {
        return {
            traceCount: this.traces.size,
            eventCount: this.totalEvents,
        };
    }
    /**
     * Check if buffer exceeds size limit.
     */
    exceedsSize(maxSize) {
        return this.totalEvents >= maxSize;
    }
}
//# sourceMappingURL=buffer.js.map