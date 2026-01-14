# Causality Event Schema

> **Version:** 1.0  
> **Status:** Stable  
> **Package:** @causality/sdk-core

This document defines the formal contract for events emitted by the Causality SDK. The Collector and any downstream consumers MUST adhere to this schema.

---

## Event Types

| Type           | Description                                         |
| -------------- | --------------------------------------------------- |
| `action.start` | Emitted when an action begins                       |
| `action.end`   | Emitted when an action completes (success or error) |

---

## Schema Version

All events implicitly conform to schema version `1.0`. Future breaking changes will increment the major version.

```typescript
const SCHEMA_VERSION = "1.0";
```

---

## ActionSnapshot

The `action` field in all events contains an immutable snapshot of the action state.

### Required Fields

| Field       | Type                           | Description                                                               |
| ----------- | ------------------------------ | ------------------------------------------------------------------------- |
| `id`        | `string`                       | UUID v4 unique identifier                                                 |
| `name`      | `string`                       | Semantic action name (e.g., `CreateOrder`)                                |
| `traceId`   | `string`                       | UUID v4 identifying the trace. First action creates it, children inherit. |
| `startTime` | `number`                       | Unix timestamp in milliseconds                                            |
| `status`    | `'running' \| 'ok' \| 'error'` | Current action status                                                     |

### Optional Fields

| Field        | Type                      | Description                                           |
| ------------ | ------------------------- | ----------------------------------------------------- |
| `parentId`   | `string`                  | UUID of parent action (for nesting)                   |
| `endTime`    | `number`                  | Unix timestamp in milliseconds (only in `action.end`) |
| `attributes` | `Record<string, unknown>` | Custom key-value pairs                                |
| `error`      | `ActionError`             | Error details (only when `status === 'error'`)        |

### ActionError

| Field     | Type      | Description          |
| --------- | --------- | -------------------- |
| `message` | `string`  | Error message        |
| `stack`   | `string?` | Optional stack trace |

---

## Event: action.start

Emitted when an action begins execution.

### Structure

```typescript
interface ActionStartEvent {
  type: "action.start";
  action: ActionSnapshot;
}
```

### Constraints

- `status` MUST be `'running'`
- `endTime` MUST be absent
- `error` MUST be absent

### Example

```json
{
  "type": "action.start",
  "action": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "CreateOrder",
    "traceId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "startTime": 1705180800000,
    "status": "running",
    "attributes": {
      "source": "web",
      "userId": "user-123"
    }
  }
}
```

---

## Event: action.end

Emitted when an action completes, either successfully or with an error.

### Structure

```typescript
interface ActionEndEvent {
  type: "action.end";
  action: ActionSnapshot;
}
```

### Constraints

- `status` MUST be `'ok'` or `'error'` (never `'running'`)
- `endTime` MUST be present
- `error` is present only when `status === 'error'`

### Example: Success

```json
{
  "type": "action.end",
  "action": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "CreateOrder",
    "traceId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "startTime": 1705180800000,
    "endTime": 1705180800150,
    "status": "ok",
    "attributes": {
      "source": "web",
      "userId": "user-123",
      "orderId": "order-456"
    }
  }
}
```

### Example: Error

```json
{
  "type": "action.end",
  "action": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "ProcessPayment",
    "traceId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "parentId": "550e8400-e29b-41d4-a716-446655440000",
    "startTime": 1705180800050,
    "endTime": 1705180800100,
    "status": "error",
    "attributes": {
      "amount": 99.99,
      "currency": "USD"
    },
    "error": {
      "message": "Payment gateway timeout",
      "stack": "Error: Payment gateway timeout\n    at processPayment (/app/src/payment.ts:42:11)"
    }
  }
}
```

---

## Event Ordering

Events are emitted in real-time as actions execute. The Collector may receive events **out of order** due to:

- Concurrent actions (Promise.all)
- Network delays (in distributed scenarios)
- Buffer flushing policies

### Guarantees

1. `action.start` is always emitted before corresponding `action.end`
2. All events for a trace share the same `traceId`
3. `parentId` correctly references an existing action within the trace

### Non-Guarantees

- Events may arrive interleaved across different traces
- Child action events may arrive before parent start in rare race conditions

---

## TraceId Rules

| Rule         | Description                                       |
| ------------ | ------------------------------------------------- |
| Creation     | First action in a context creates a new `traceId` |
| Inheritance  | Nested actions inherit `traceId` from parent      |
| Immutability | `traceId` is never recalculated once set          |
| Format       | UUID v4                                           |

---

## Status Semantics

| Status    | Meaning                       | Emission               |
| --------- | ----------------------------- | ---------------------- |
| `running` | Action is executing           | Only in `action.start` |
| `ok`      | Action completed successfully | Only in `action.end`   |
| `error`   | Action failed with error      | Only in `action.end`   |

**Critical:** `running` is NEVER emitted in `action.end` events.

---

## Compatibility

This schema is the contract between:

- `@causality/sdk-core` (producer)
- `@causality/collector-core` (consumer)
- Future storage backends
- Future analysis tools

Breaking changes require a major schema version bump.
