# @causality/collector-core

Collector for buffering, reconstructing, and flushing causal traces.

> **Phase 2** — Collector Core

## Overview

The Collector consumes events from `@causality/sdk-core` and:

- **Buffers** events in memory, grouped by `traceId`
- **Reconstructs** causal trace trees from unordered events
- **Flushes** complete traces to pluggable transports

## Installation

```bash
npm install @causality/collector-core
```

## Quick Start

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";
import { createCollector, ConsoleTransport } from "@causality/collector-core";

// Create collector with console output
const collector = createCollector({
  flushIntervalMs: 2000,
  transport: new ConsoleTransport({ pretty: true }),
});

// Connect SDK to collector
onActionEvent((event) => collector.ingest(event));

// Run some actions
await runAction("CreateOrder", async () => {
  await runAction("ValidateUser", async () => {
    /* ... */
  });
  await runAction("ProcessPayment", async () => {
    /* ... */
  });
});

// Graceful shutdown
await collector.stop();
```

## API Reference

### `createCollector(config)`

Create a new collector instance.

```typescript
const collector = createCollector({
  flushIntervalMs: 5000, // Flush interval (default: 5000ms)
  maxBufferSize: 100, // Max events before force flush (default: 100)
  traceTimeoutMs: 30000, // Timeout for incomplete traces (default: 30000ms)
  transport: new ConsoleTransport(),
});
```

### Collector Methods

| Method          | Description                               |
| --------------- | ----------------------------------------- |
| `ingest(event)` | Add an action event to the buffer         |
| `flush()`       | Force flush all buffered traces           |
| `stop()`        | Stop collector and flush remaining traces |
| `stats()`       | Get current buffer statistics             |

---

## Transports

### ConsoleTransport

Logs traces to stdout. Good for development.

```typescript
const transport = new ConsoleTransport({
  prefix: "[trace]", // Log prefix
  pretty: true, // Pretty-print JSON
});
```

### InMemoryTransport

Stores traces in memory. Good for testing.

```typescript
const transport = new InMemoryTransport();

// After collecting...
const traces = transport.getTraces();
const trace = transport.getTrace("trace-id");
transport.clear();
```

### FileTransport

Appends traces as NDJSON (one JSON per line).

```typescript
const transport = new FileTransport("/var/log/traces.ndjson");
```

### MultiTransport

Sends to multiple transports.

```typescript
const transport = new MultiTransport([
  new ConsoleTransport(),
  new FileTransport("/var/log/traces.ndjson"),
]);
```

### NullTransport

Discards traces. Useful for benchmarking.

```typescript
const transport = new NullTransport();
```

### Custom Transport

Implement the `CollectorTransport` interface:

```typescript
interface CollectorTransport {
  send(trace: CausalityTrace): Promise<void>;
  close?(): Promise<void>;
}
```

---

## Trace Output

The collector produces `CausalityTrace` objects:

```typescript
interface CausalityTrace {
  traceId: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  rootActions: CausalityActionNode[];
  status: "ok" | "error" | "partial";
  actionCount: number;
  maxDepth: number;
}

interface CausalityActionNode {
  id: string;
  name: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: "ok" | "error" | "incomplete";
  depth: number;
  attributes?: Record<string, unknown>;
  error?: { message: string; stack?: string };
  children: CausalityActionNode[];
}
```

### Example Output

```json
{
  "traceId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "startTime": 1705180800000,
  "endTime": 1705180800150,
  "durationMs": 150,
  "status": "ok",
  "actionCount": 3,
  "maxDepth": 1,
  "rootActions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "CreateOrder",
      "startTime": 1705180800000,
      "endTime": 1705180800150,
      "durationMs": 150,
      "status": "ok",
      "depth": 0,
      "children": [
        {
          "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "name": "ValidateUser",
          "parentId": "550e8400-e29b-41d4-a716-446655440000",
          "startTime": 1705180800010,
          "endTime": 1705180800050,
          "durationMs": 40,
          "status": "ok",
          "depth": 1,
          "children": []
        }
      ]
    }
  ]
}
```

---

## Flush Policies

### Time-based

Traces are flushed every `flushIntervalMs`. Default: 5000ms.

### Size-based

When buffer exceeds `maxBufferSize` events, ready traces are flushed. Default: 100.

### Completion-based

A trace flushes immediately when all its actions have `action.end` events.

### Timeout-based

Incomplete traces (missing `action.end`) are flushed after `traceTimeoutMs` and marked as `partial`. Default: 30000ms.

---

## Trace Status

| Status    | Meaning                            |
| --------- | ---------------------------------- |
| `ok`      | All actions completed successfully |
| `error`   | At least one action failed         |
| `partial` | Incomplete or inconsistent trace   |

---

## Integration with SDK

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";
import { createCollector, InMemoryTransport } from "@causality/collector-core";

const transport = new InMemoryTransport();
const collector = createCollector({
  transport,
  flushIntervalMs: 1000,
});

// Wire SDK events to collector
const unsubscribe = onActionEvent((event) => collector.ingest(event));

// Your application code
await runAction("MyAction", async () => {
  // ...
});

// Cleanup
unsubscribe();
await collector.stop();

// Access traces
console.log(transport.getTraces());
```

---

## Requirements

- Node.js >= 18.0.0
- @causality/sdk-core >= 0.1.0

## License

MIT
