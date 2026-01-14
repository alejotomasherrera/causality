/**
 * @causality/collector-core — Transports
 *
 * Transport implementations for sending traces.
 */
import type { CausalityTrace, CollectorTransport } from './types.js';
/**
 * Console transport — logs traces to stdout.
 * Useful for development and debugging.
 */
export declare class ConsoleTransport implements CollectorTransport {
    private readonly prefix;
    private readonly pretty;
    constructor(options?: {
        prefix?: string;
        pretty?: boolean;
    });
    send(trace: CausalityTrace): Promise<void>;
}
/**
 * In-memory transport — stores traces for testing.
 */
export declare class InMemoryTransport implements CollectorTransport {
    private readonly traces;
    send(trace: CausalityTrace): Promise<void>;
    /**
     * Get all received traces.
     */
    getTraces(): CausalityTrace[];
    /**
     * Get trace by ID.
     */
    getTrace(traceId: string): CausalityTrace | undefined;
    /**
     * Get total trace count.
     */
    count(): number;
    /**
     * Clear all traces.
     */
    clear(): void;
}
/**
 * File transport — appends traces to a file as NDJSON.
 * Each trace is a single JSON line for easy parsing.
 */
export declare class FileTransport implements CollectorTransport {
    private readonly filePath;
    private writeStream;
    constructor(filePath: string);
    send(trace: CausalityTrace): Promise<void>;
    close(): Promise<void>;
}
/**
 * Multi-transport — sends to multiple transports.
 * Useful for logging to console AND storing.
 */
export declare class MultiTransport implements CollectorTransport {
    private readonly transports;
    constructor(transports: CollectorTransport[]);
    send(trace: CausalityTrace): Promise<void>;
    close(): Promise<void>;
}
/**
 * Null transport — discards all traces.
 * Useful for testing collector without side effects.
 */
export declare class NullTransport implements CollectorTransport {
    send(_trace: CausalityTrace): Promise<void>;
}
//# sourceMappingURL=transport.d.ts.map