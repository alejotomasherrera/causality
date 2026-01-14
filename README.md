# Causality

Causality is a framework for capturing, reconstructing, and explaining the causal execution of distributed systems — from user intent to system behavior.

## Status

**Phase 1** — Semantic SDK (in development)

## Packages

| Package                                  | Description                                            | Status     |
| ---------------------------------------- | ------------------------------------------------------ | ---------- |
| [@causality/sdk-core](packages/sdk-core) | Core SDK for declaring Actions and propagating context | 🚧 Phase 1 |
| @causality/collector                     | Event collection and transport                         | 📋 Planned |
| @causality/correlator                    | Causal trace reconstruction                            | 📋 Planned |

## Quick Start

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";

// Subscribe to events
onActionEvent((event) => console.log(JSON.stringify(event)));

// Declare semantic actions
await runAction("CreateOrder", async () => {
  await runAction("ValidateUser", async () => {
    /* ... */
  });
  await runAction("ProcessPayment", async () => {
    /* ... */
  });
});
```

## Documentation

- [Foundations](docs/FOUNDATIONS.md) — Core principles and glossary
- [SDK Core README](packages/sdk-core/README.md) — API reference

## Examples

- [Basic Usage](examples/basic-usage) — Simple order processing flow

## License

MIT
