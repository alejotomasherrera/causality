# @causality/storage-core

Storage and query layer for causal traces.

> **Phase 3A** — Storage & Query Core

## Overview

This package provides:

- **Storage**: Persist and retrieve `CausalityTrace` objects
- **Indexing**: Fast lookups by status, action name, duration, time range
- **Repository**: Query API with composable filters

## When to Use What

| Implementation    | Use Case                                      |
| ----------------- | --------------------------------------------- |
| `InMemoryStorage` | Development, testing, short-lived processes   |
| `JSONLStorage`    | Production edge agents, serverless, debugging |

### Why No Database?

Phase 3A intentionally avoids databases to:

- Keep zero infrastructure requirements
- Enable edge/serverless deployment
- Maintain simplicity and debuggability

Database adapters are planned for Phase 4.

## Installation

```bash
npm install @causality/storage-core
```

## Quick Start

```typescript
import { InMemoryStorage, TraceRepository } from "@causality/storage-core";
import { createCollector, ConsoleTransport } from "@causality/collector-core";

// Create storage and repository
const storage = new InMemoryStorage();
const repo = new TraceRepository(storage);

// Connect collector to storage
const collector = createCollector({
  transport: {
    async send(trace) {
      await storage.save(trace);
    },
  },
});

// Query traces
const failed = await repo.findFailed();
const slow = await repo.findSlow(500);
```

## Storage API

### InMemoryStorage

```typescript
const storage = new InMemoryStorage();

// Save
await storage.save(trace);

// Get by ID
const trace = await storage.get("trace-id");

// List all
for await (const trace of storage.list()) {
  console.log(trace.traceId);
}

// Delete
await storage.delete("trace-id");

// Count
const count = await storage.count();

// Clear all
storage.clear();
```

### JSONLStorage

```typescript
import { JSONLStorage } from "@causality/storage-core";

const storage = new JSONLStorage("/var/log/traces.jsonl");

// Initialize (loads existing file)
await storage.initialize();

// Save (appends to file)
await storage.save(trace);

// Compact (removes deleted/overwritten entries)
await storage.compact();

// Close (flush pending writes)
await storage.close();
```

## Repository API

### Basic Queries

```typescript
const repo = new TraceRepository(storage);

// By status
const errors = await repo.query({ status: "error" });

// By action name
const orders = await repo.query({ actionName: "CreateOrder" });

// By duration
const slow = await repo.query({ minDurationMs: 500 });
const fast = await repo.query({ maxDurationMs: 100 });

// By time range
const recent = await repo.query({
  from: Date.now() - 60000,
  to: Date.now(),
});

// Combined
const results = await repo.query({
  status: "error",
  actionName: "ProcessPayment",
  minDurationMs: 500,
  from: Date.now() - 3600000,
  orderBy: "duration",
  order: "desc",
  limit: 10,
});
```

### Action-Level Filtering

```typescript
// Find traces where ProcessPayment > 500ms
const results = await repo.queryWithActions({
  actionFilter: {
    name: "ProcessPayment",
    minDurationMs: 500,
  },
});

// Find traces where ProcessPayment failed
const failed = await repo.queryWithActions({
  status: "error",
  actionFilter: {
    name: "ProcessPayment",
    status: "error",
  },
});
```

### Convenience Methods

```typescript
// Find all failed traces
const failed = await repo.findFailed();

// Find slow traces
const slow = await repo.findSlow(1000);

// Find by action
const orders = await repo.findByAction("CreateOrder");

// Find slow specific action
const slowPayments = await repo.findSlowAction("ProcessPayment", 500);

// Find failed specific action
const failedPayments = await repo.findFailedAction("ProcessPayment");
```

## Query Reference

### TraceQuery

| Field           | Type                           | Description                   |
| --------------- | ------------------------------ | ----------------------------- |
| `traceId`       | `string`                       | Exact trace ID match          |
| `status`        | `'ok' \| 'error' \| 'partial'` | Filter by trace status        |
| `actionName`    | `string`                       | Traces containing this action |
| `minDurationMs` | `number`                       | Minimum trace duration        |
| `maxDurationMs` | `number`                       | Maximum trace duration        |
| `from`          | `number`                       | Start time >= this timestamp  |
| `to`            | `number`                       | Start time <= this timestamp  |
| `limit`         | `number`                       | Maximum results               |
| `orderBy`       | `'startTime' \| 'duration'`    | Sort field                    |
| `order`         | `'asc' \| 'desc'`              | Sort direction                |

### ActionQuery

| Field           | Type                              | Description             |
| --------------- | --------------------------------- | ----------------------- |
| `name`          | `string`                          | Action name to match    |
| `status`        | `'ok' \| 'error' \| 'incomplete'` | Action status           |
| `minDurationMs` | `number`                          | Minimum action duration |
| `maxDurationMs` | `number`                          | Maximum action duration |

## Indexing

The `TraceIndex` class provides fast lookups:

```typescript
import { TraceIndex } from "@causality/storage-core";

const index = new TraceIndex();

// Add trace to index
index.add(trace);

// Query indexes
const errorIds = index.getByStatus("error");
const paymentIds = index.getByActionName("ProcessPayment");
const slowIds = index.getByDurationRange(500, undefined);

// Stats
const stats = index.stats();
```

## Integration Example

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";
import { createCollector } from "@causality/collector-core";
import { InMemoryStorage, TraceRepository } from "@causality/storage-core";

// Setup
const storage = new InMemoryStorage();
const repo = new TraceRepository(storage);

const collector = createCollector({
  flushIntervalMs: 1000,
  transport: {
    async send(trace) {
      await storage.save(trace);
      console.log(`Stored trace: ${trace.traceId}`);
    },
  },
});

onActionEvent((event) => collector.ingest(event));

// Run actions
await runAction("CreateOrder", async () => {
  await runAction("ProcessPayment", async () => {
    // ...
  });
});

await collector.flush();

// Query
const results = await repo.query({
  status: "error",
  actionName: "ProcessPayment",
  minDurationMs: 500,
});

console.log(`Found ${results.length} matching traces`);
```

## File Format (JSONL)

JSONLStorage uses newline-delimited JSON:

```
{"traceId":"abc","startTime":1705180800000,"status":"ok",...}
{"traceId":"def","startTime":1705180801000,"status":"error",...}
```

Each line is a complete `CausalityTrace` object.

## Limitations

- **In-memory indexes**: All indexes are kept in memory
- **No transactions**: Each save is independent
- **No replication**: Single-node only
- **No real-time updates**: Query sees state at query time

These limitations are intentional for Phase 3A. Database adapters in Phase 4 will address production scaling needs.

## Requirements

- Node.js >= 18.0.0
- @causality/collector-core >= 0.1.0

## License

MIT
