/**
 * @causality/storage-core — JSONLStorage
 *
 * Append-only JSON Lines file storage.
 * Simple, debuggable, zero infrastructure.
 */

import { createReadStream, createWriteStream } from 'fs';
import { open, stat, unlink } from 'fs/promises';
import { createInterface } from 'readline';
import type { CausalityTrace, TraceStorage } from '../types.js';
import { serializeTrace, deserializeTrace } from '../serializers.js';
import { TraceIndex } from '../indexes.js';

/**
 * JSONL file storage with in-memory index.
 *
 * File format: One JSON object per line (newline-delimited JSON)
 * Each line is a complete CausalityTrace.
 */
export class JSONLStorage implements TraceStorage {
  private readonly filePath: string;
  private readonly index = new TraceIndex();
  private readonly traceCache = new Map<string, CausalityTrace>();
  private writeStream: ReturnType<typeof createWriteStream> | null = null;
  private initialized = false;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Initialize storage by loading existing file.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const fileStat = await stat(this.filePath);
      if (fileStat.isFile() && fileStat.size > 0) {
        await this.loadFromFile();
      }
    } catch (err: unknown) {
      // File doesn't exist yet — that's fine
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }

    this.initialized = true;
  }

  /**
   * Save a trace to file (append).
   */
  async save(trace: CausalityTrace): Promise<void> {
    await this.ensureInitialized();

    // Update in-memory state
    this.traceCache.set(trace.traceId, trace);

    // Update index (remove old version first)
    this.index.remove(trace.traceId);
    this.index.add(trace);

    // Append to file
    await this.appendToFile(trace);
  }

  /**
   * Get a trace by ID.
   */
  async get(traceId: string): Promise<CausalityTrace | null> {
    await this.ensureInitialized();
    return this.traceCache.get(traceId) ?? null;
  }

  /**
   * Iterate over all traces.
   */
  async *list(): AsyncIterable<CausalityTrace> {
    await this.ensureInitialized();
    for (const trace of this.traceCache.values()) {
      yield trace;
    }
  }

  /**
   * Delete a trace by ID.
   * Note: This only removes from cache/index.
   * The file will still contain the old entry until compaction.
   */
  async delete(traceId: string): Promise<boolean> {
    await this.ensureInitialized();

    const existed = this.traceCache.delete(traceId);
    if (existed) {
      this.index.remove(traceId);
    }
    return existed;
  }

  /**
   * Get count of stored traces.
   */
  async count(): Promise<number> {
    await this.ensureInitialized();
    return this.traceCache.size;
  }

  /**
   * Close storage and flush pending writes.
   */
  async close(): Promise<void> {
    if (this.writeStream) {
      await new Promise<void>((resolve, reject) => {
        this.writeStream!.end((err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.writeStream = null;
    }
  }

  /**
   * Get the underlying index for queries.
   */
  getIndex(): TraceIndex {
    return this.index;
  }

  /**
   * Compact the file by rewriting only current traces.
   * Removes deleted/overwritten entries.
   */
  async compact(): Promise<void> {
    await this.ensureInitialized();

    const tempPath = `${this.filePath}.tmp`;

    // Write current state to temp file
    const tempStream = createWriteStream(tempPath, { flags: 'w' });

    for (const trace of this.traceCache.values()) {
      const line = serializeTrace(trace) + '\n';
      await new Promise<void>((resolve, reject) => {
        tempStream.write(line, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    await new Promise<void>((resolve) => tempStream.end(resolve));

    // Close current write stream
    if (this.writeStream) {
      await new Promise<void>((resolve) => this.writeStream!.end(resolve));
      this.writeStream = null;
    }

    // Replace original with temp
    const fs = await import('fs/promises');
    await fs.rename(tempPath, this.filePath);
  }

  /**
   * Get traces by IDs (batch).
   */
  async getMany(traceIds: Iterable<string>): Promise<CausalityTrace[]> {
    await this.ensureInitialized();
    const results: CausalityTrace[] = [];
    for (const id of traceIds) {
      const trace = this.traceCache.get(id);
      if (trace) {
        results.push(trace);
      }
    }
    return results;
  }

  // --- Private helpers ---

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async loadFromFile(): Promise<void> {
    const fileStream = createReadStream(this.filePath, { encoding: 'utf8' });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim() === '') continue;

      try {
        const trace = deserializeTrace(line);

        // Latest entry wins (for duplicates/updates)
        this.traceCache.set(trace.traceId, trace);

        // Update index
        this.index.remove(trace.traceId);
        this.index.add(trace);
      } catch (err) {
        console.warn(`[storage] Failed to parse line: ${err}`);
      }
    }
  }

  private async appendToFile(trace: CausalityTrace): Promise<void> {
    if (!this.writeStream) {
      this.writeStream = createWriteStream(this.filePath, { flags: 'a' });
    }

    const line = serializeTrace(trace) + '\n';

    await new Promise<void>((resolve, reject) => {
      this.writeStream!.write(line, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
