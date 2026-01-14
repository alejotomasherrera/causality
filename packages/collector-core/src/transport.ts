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
export class ConsoleTransport implements CollectorTransport {
  private readonly prefix: string;
  private readonly pretty: boolean;

  constructor(options?: { prefix?: string; pretty?: boolean }) {
    this.prefix = options?.prefix ?? '[causality]';
    this.pretty = options?.pretty ?? false;
  }

  async send(trace: CausalityTrace): Promise<void> {
    const json = this.pretty
      ? JSON.stringify(trace, null, 2)
      : JSON.stringify(trace);

    console.log(`${this.prefix} trace:`, json);
  }
}

/**
 * In-memory transport — stores traces for testing.
 */
export class InMemoryTransport implements CollectorTransport {
  private readonly traces: CausalityTrace[] = [];

  async send(trace: CausalityTrace): Promise<void> {
    this.traces.push(trace);
  }

  /**
   * Get all received traces.
   */
  getTraces(): CausalityTrace[] {
    return [...this.traces];
  }

  /**
   * Get trace by ID.
   */
  getTrace(traceId: string): CausalityTrace | undefined {
    return this.traces.find((t) => t.traceId === traceId);
  }

  /**
   * Get total trace count.
   */
  count(): number {
    return this.traces.length;
  }

  /**
   * Clear all traces.
   */
  clear(): void {
    this.traces.length = 0;
  }
}

/**
 * File transport — appends traces to a file as NDJSON.
 * Each trace is a single JSON line for easy parsing.
 */
export class FileTransport implements CollectorTransport {
  private readonly filePath: string;
  private writeStream: import('fs').WriteStream | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async send(trace: CausalityTrace): Promise<void> {
    if (!this.writeStream) {
      const fs = await import('fs');
      this.writeStream = fs.createWriteStream(this.filePath, { flags: 'a' });
    }

    const line = JSON.stringify(trace) + '\n';
    
    return new Promise((resolve, reject) => {
      this.writeStream!.write(line, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async close(): Promise<void> {
    if (this.writeStream) {
      return new Promise((resolve) => {
        this.writeStream!.end(() => {
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
export class MultiTransport implements CollectorTransport {
  private readonly transports: CollectorTransport[];

  constructor(transports: CollectorTransport[]) {
    this.transports = transports;
  }

  async send(trace: CausalityTrace): Promise<void> {
    await Promise.all(this.transports.map((t) => t.send(trace)));
  }

  async close(): Promise<void> {
    await Promise.all(
      this.transports.map((t) => t.close?.())
    );
  }
}

/**
 * Null transport — discards all traces.
 * Useful for testing collector without side effects.
 */
export class NullTransport implements CollectorTransport {
  async send(_trace: CausalityTrace): Promise<void> {
    // Intentionally empty
  }
}
