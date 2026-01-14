# Causality

Causality is a framework for capturing, reconstructing, and explaining the causal execution of distributed systems — from user intent to system behavior.

## Status: ✅ Project Completed (Phases 1-10)

The Causality Framework is fully implemented, featuring 10 core packages that provide an end-to-end pipeline for observability, resilience, and predictive analysis.

## Core Packages

| Package                                                              | Description                                            | Phase       |
| :------------------------------------------------------------------- | :----------------------------------------------------- | :---------- |
| **[@causality/sdk-core](packages/sdk-core)**                         | Core SDK for declaring Actions and propagating context | ✅ Phase 1  |
| **[@causality/collector-core](packages/collector-core)**             | Event buffering, trace reconstruction, and transport   | ✅ Phase 2  |
| **[@causality/storage-core](packages/storage-core)**                 | Trace persistence, indexing, and queries               | ✅ Phase 3A |
| **[@causality/metrics-core](packages/metrics-core)**                 | Metrics correlation and degradation detection          | ✅ Phase 3B |
| **[@causality/reproducibility-core](packages/reproducibility-core)** | Reproducibility explanation engine (Markdown)          | ✅ Phase 4A |
| **[@causality/impact-core](packages/impact-core)**                   | Impact scoring and notification policy                 | ✅ Phase 5  |
| **[@causality/behavior-core](packages/behavior-core)**               | Behavioral consistency analysis & anomaly detection    | ✅ Phase 6  |
| **[@causality/code-tracing-core](packages/code-tracing-core)**       | Code analysis and cross-service propagation            | ✅ Phase 7  |
| **[@causality/historical-core](packages/historical-core)**           | Historical aggregation & trend analysis                | ✅ Phase 8  |
| **[@causality/ai-core](packages/ai-core)**                           | AI-driven insights & pattern recognition               | ✅ Phase 9  |
| **[@causality/predictive-core](packages/predictive-core)**           | Predictive analysis & auto-learning                    | ✅ Phase 10 |

## Getting Started

### 1. Build the Framework using Scripts

We provide scripts to easily build all packages in the correct order.

```bash
# Build all packages locally
./scripts/build-all.sh
```

### 2. Run the Full Integration Example

To see the entire framework in action (simulating a microservice with degradation and AI predictions):

```bash
# Verify the build first
./scripts/build-all.sh

# Install and run the example
cd examples/full-flow-integration
npm install
npm start
```

_See `examples/full-flow-integration/README.md` for more details._

### 3. Use in Your External Project

To install the Causality SDK into your own Node.js application:

1.  **Generate Packages:**

    ```bash
    ./scripts/pack-all.sh
    ```

    This creates `.tgz` files in the `release/` directory.

2.  **Install & Integrate:**
    Follow the detailed guide at **[docs/EXTERNAL_INTEGRATION.md](docs/EXTERNAL_INTEGRATION.md)**.

## Quick Code Example

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";
import { createCollector } from "@causality/collector-core";
import { PipelineTransport } from "./pipeline"; // Your custom transport

// 1. Initialize Collector
const collector = createCollector({
  transport: new PipelineTransport(/* wired cores */),
});

// 2. Hook Events
onActionEvent((event) => collector.ingest(event));

// 3. Instrument Logic
await runAction("ProcessOrder", async () => {
  await runAction("ValidateUser", async () => {
    // ... business logic
  });
});
```

## Documentation

- [Foundations](docs/FOUNDATIONS.md) — Core principles
- [Event Schema](docs/EVENT-SCHEMA.md) — Formal event contract
- **[External Integration Guide](docs/EXTERNAL_INTEGRATION.md)** — How to use this SDK externally

## License

MIT

---

Hecho con ❤️ por **Alejo Herrera**
