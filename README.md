# Causality

Causality is a framework for capturing, reconstructing, and explaining the causal execution of distributed systems — from user intent to system behavior.

## Status

**Phase 6** — Behavior Analysis Core (in development)

## Packages

| Package                                                          | Description                                            | Status      |
| ---------------------------------------------------------------- | ------------------------------------------------------ | ----------- |
| [@causality/sdk-core](packages/sdk-core)                         | Core SDK for declaring Actions and propagating context | ✅ Phase 1  |
| [@causality/collector-core](packages/collector-core)             | Event buffering, trace reconstruction, and transport   | ✅ Phase 2  |
| [@causality/storage-core](packages/storage-core)                 | Trace persistence, indexing, and queries               | ✅ Phase 3A |
| [@causality/metrics-core](packages/metrics-core)                 | Metrics correlation and degradation detection          | ✅ Phase 3B |
| [@causality/reproducibility-core](packages/reproducibility-core) | Reproducibility explanation engine                     | ✅ Phase 4A |
| [@causality/impact-core](packages/impact-core)                   | Impact scoring and notification policy                 | ✅ Phase 5  |
| [@causality/behavior-core](packages/behavior-core)               | Behavioral consistency analysis                        | ✅ Phase 6  |
| [@causality/code-tracing-core](packages/code-tracing-core)       | Code analysis and cross-service propagation            | ✅ Phase 7  |
| [@causality/historical-core](packages/historical-core)           | Historical aggregation & trend analysis                | ✅ Phase 8  |
| [@causality/ai-core](packages/ai-core)                           | AI-driven insights & pattern recognition               | ✅ Phase 9  |
| [@causality/predictive-core](packages/predictive-core)           | Predictive analysis & auto-learning                    | ✅ Phase 10 |

## Quick Start

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";
import { createCollector } from "@causality/collector-core";
import { InMemoryStorage } from "@causality/storage-core";
import { MetricsCollector } from "@causality/metrics-core";
import { buildExplanation } from "@causality/reproducibility-core";

// Setup
const storage = new InMemoryStorage();
const metricsCollector = new MetricsCollector();

const collector = createCollector({
  transport: { send: async (trace) => storage.save(trace) },
});

onActionEvent((event) => {
  collector.ingest(event);
  metricsCollector.ingest(event);
});

// Run actions
await runAction("ProcessPayment", async () => {
  /* ... */
});
await collector.flush();

// Get trace and build reproducibility explanation
const trace = await storage.get("trace-id");
const metrics = metricsCollector.getMetricsByTrace("trace-id");
const findings = metricsCollector.getFindings();

const explanation = buildExplanation({ trace, metrics, findings });

console.log(explanation.summary);
// "Silent degradation in: 'ProcessPayment'. Peak duration: 800ms."

console.log(explanation.replayInstructions);
// Step-by-step instructions to reproduce the issue
```

## Documentation

- [Foundations](docs/FOUNDATIONS.md) — Core principles and glossary
- [Event Schema](docs/EVENT-SCHEMA.md) — Formal event contract
- [SDK Core README](packages/sdk-core/README.md) — SDK API reference
- [Collector Core README](packages/collector-core/README.md) — Collector API reference
- [Storage Core README](packages/storage-core/README.md) — Storage & Query API reference
- [Metrics Core README](packages/metrics-core/README.md) — Metrics Correlation API reference
- [Reproducibility Core README](packages/reproducibility-core/README.md) — Reproducibility Explanation API
- [Impact Core README](packages/impact-core/README.md) — Impact Scoring & Notification Policy
- [Behavior Core README](packages/behavior-core/README.md) — Behavioral Consistency Analysis
- [Code Tracing Core README](packages/code-tracing-core/README.md) — Code Analysis & Service Propagation
- [Historical Core README](packages/historical-core/README.md) — Historical & Trend Analysis
- [AI Core README](packages/ai-core/README.md) — AI Insights
- [Predictive Core README](packages/predictive-core/README.md) — Predictive Analysis

## Examples

- [Basic Usage](examples/basic-usage) — Simple SDK usage
- [Collector Integration](examples/collector-integration) — SDK + Collector end-to-end

## License

MIT
