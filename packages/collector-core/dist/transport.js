/**
 * @causality/collector-core — Transports
 *
 * Transport implementations for sending traces.
 */
/**
 * Console transport — logs traces to stdout.
 * Useful for development and debugging.
 */
export class ConsoleTransport {
    prefix;
    pretty;
    constructor(options) {
        this.prefix = options?.prefix ?? '[causality]';
        this.pretty = options?.pretty ?? false;
    }
    async send(trace) {
        const json = this.pretty
            ? JSON.stringify(trace, null, 2)
            : JSON.stringify(trace);
        console.log(`${this.prefix} trace:`, json);
    }
}
/**
 * In-memory transport — stores traces for testing.
 */
export class InMemoryTransport {
    traces = [];
    async send(trace) {
        this.traces.push(trace);
    }
    /**
     * Get all received traces.
     */
    getTraces() {
        return [...this.traces];
    }
    /**
     * Get trace by ID.
     */
    getTrace(traceId) {
        return this.traces.find((t) => t.traceId === traceId);
    }
    /**
     * Get total trace count.
     */
    count() {
        return this.traces.length;
    }
    /**
     * Clear all traces.
     */
    clear() {
        this.traces.length = 0;
    }
}
/**
 * File transport — appends traces to a file as NDJSON.
 * Each trace is a single JSON line for easy parsing.
 */
export class FileTransport {
    filePath;
    writeStream = null;
    constructor(filePath) {
        this.filePath = filePath;
    }
    async send(trace) {
        if (!this.writeStream) {
            const fs = await import('fs');
            this.writeStream = fs.createWriteStream(this.filePath, { flags: 'a' });
        }
        const line = JSON.stringify(trace) + '\n';
        return new Promise((resolve, reject) => {
            this.writeStream.write(line, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async close() {
        if (this.writeStream) {
            return new Promise((resolve) => {
                this.writeStream.end(() => {
                    this.writeStream = null;
                    resolve();
                });
            });
        }
    }
}
/**
 * Multi-transport — sends to multiple transports.
 * Useful for logging to console AND storing.
 */
export class MultiTransport {
    transports;
    constructor(transports) {
        this.transports = transports;
    }
    async send(trace) {
        await Promise.all(this.transports.map((t) => t.send(trace)));
    }
    async close() {
        await Promise.all(this.transports.map((t) => t.close?.()));
    }
}
/**
 * Null transport — discards all traces.
 * Useful for testing collector without side effects.
 */
export class NullTransport {
    async send(_trace) {
        // Intentionally empty
    }
}
//# sourceMappingURL=transport.js.map