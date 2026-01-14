# @causality/sdk-core

Core SDK for capturing causal execution of distributed systems.

> **Phase 1** — Semantic SDK

## Overview

This SDK allows you to:

- **Declare Actions** — semantic units of execution representing intentions or steps
- **Propagate Context** — automatically through async code via `AsyncLocalStorage`
- **Emit Structured Events** — JSON events for later causal reconstruction

**This SDK is NOT a logger.** It captures _what happened_, _in what order_, _with what duration_, and _under what context_.

## Installation

```bash
npm install @causality/sdk-core
```

## Quick Start

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";

// Subscribe to action events
onActionEvent((event) => {
  console.log(JSON.stringify(event));
});

// Create actions around your business logic
const result = await runAction("CreateOrder", async () => {
  // Nested actions automatically inherit traceId
  const user = await runAction("ValidateUser", async () => {
    return await validateUser();
  });

  return await createOrder(user);
});
```

## API Reference

### `runAction(input, fn)`

Execute a function within an action context. **Recommended approach.**

```typescript
// Simple usage
await runAction('CreateOrder', async () => {
  // your logic
});

// With options
await runAction(
  { name: 'CreateOrder', attributes: { source: 'web' } },
  async () => { ... }
);
```

**Parameters:**

- `input` — Action name (string) or `ActionOptions` object
- `fn` — Async function to execute

**Behavior:**

- Automatically creates the action
- Propagates context for nested actions
- Ends with `ok` on success, `error` on exception
- Re-throws any errors

---

### `startAction(input)`

Create an action manually for fine-grained control.

```typescript
const action = startAction("ProcessPayment");
try {
  action.setAttribute("amount", 100);
  // your logic
  action.end();
} catch (err) {
  action.end(err);
}
```

**Returns:** `ActionHandle` with:

- `id` — Unique action ID
- `traceId` — Trace ID (inherited or created)
- `setAttribute(key, value)` — Add custom attribute
- `end(error?)` — Complete the action

---

### `getCurrentAction()`

Get the current action context.

```typescript
const ctx = getCurrentAction();
if (ctx) {
  console.log(`Trace: ${ctx.traceId}, Action: ${ctx.actionId}`);
}
```

**Returns:** `{ traceId, actionId }` or `undefined` if not inside an action.

---

### `onActionEvent(listener)`

Subscribe to action events.

```typescript
const unsubscribe = onActionEvent((event) => {
  // event.type: 'action.start' | 'action.end'
  // event.action: ActionSnapshot
  sendToCollector(event);
});

// Later: stop receiving events
unsubscribe();
```

**Best-effort:** Listeners are wrapped in try/catch. A failing listener won't break the SDK.

## Event Structure

### `action.start`

```json
{
  "type": "action.start",
  "action": {
    "id": "abc-123",
    "name": "CreateOrder",
    "traceId": "xyz-789",
    "status": "running",
    "startTime": 1705180800000,
    "attributes": { "source": "web" }
  }
}
```

### `action.end`

```json
{
  "type": "action.end",
  "action": {
    "id": "abc-123",
    "name": "CreateOrder",
    "traceId": "xyz-789",
    "parentId": null,
    "status": "ok",
    "startTime": 1705180800000,
    "endTime": 1705180800050,
    "attributes": { "source": "web", "orderId": "order-001" }
  }
}
```

### Error Case

```json
{
  "type": "action.end",
  "action": {
    "id": "def-456",
    "name": "ProcessPayment",
    "traceId": "xyz-789",
    "parentId": "abc-123",
    "status": "error",
    "startTime": 1705180800010,
    "endTime": 1705180800030,
    "error": {
      "message": "Payment gateway unavailable",
      "stack": "Error: Payment gateway unavailable\n    at ..."
    }
  }
}
```

## Key Design Rules

### TraceId Inheritance

- **First action** in a context creates the `traceId`
- **Child actions** inherit the same `traceId`
- TraceId is **never recalculated**

### Status Semantics

- `running` — Only exists in memory during execution
- `ok` — Action completed successfully
- `error` — Action failed with an error

**Important:** `running` is never emitted in `action.end` events.

### Immutable Snapshots

Events contain **immutable snapshots** of action state, not the mutable internal state. This ensures:

- Safe serialization
- Consistent event data
- No unexpected mutations

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (recommended)

## License

MIT
