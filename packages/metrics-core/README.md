# @causality/metrics-core

Metrics correlation for causal actions — detect degradation without explicit errors.

> **Phase 3B** — Metrics Correlation Core

## Overview

This package correlates semantic actions with resource metrics to detect:

- **Slow actions** that degrade UX
- **CPU spikes** during action execution
- **Memory spikes** that indicate leaks
- **Event loop lag** that blocks the main thread
- **Silent degradation** — actions that succeed but hurt performance

## Key Concept: Silent Degradation

The primary value of Phase 3B is detecting actions that:

✅ Succeed (status = 'ok')  
❌ Degrade user experience (slow, memory-hungry, CPU-intensive)

This answers: _"This action didn't fail, but it degraded the UX"_

## Installation

```bash
npm install @causality/metrics-core
```

## Quick Start

```typescript
import { onActionEvent } from "@causality/sdk-core";
import { MetricsCollector } from "@causality/metrics-core";

// Create collector with custom thresholds
const metrics = new MetricsCollector({
  thresholds: {
    maxDurationMs: 500,
    maxCpuDelta: 20,
    maxMemoryDeltaMb: 50,
  },
});

// Connect to SDK
onActionEvent((event) => metrics.ingest(event));

// Run your actions...
await runAction("ProcessPayment", async () => {
  // Heavy computation...
});

// Get findings
const findings = metrics.getFindings();
const silentDegradations = metrics.getSilentDegradations();

// Cleanup
metrics.destroy();
```

## API Reference

### MetricsCollector

```typescript
const metrics = new MetricsCollector({
  thresholds: {
    maxDurationMs: 500, // Action duration threshold
    maxCpuDelta: 20, // CPU % increase threshold
    maxMemoryDeltaMb: 50, // Memory increase threshold
    maxEventLoopLagMs: 100, // Event loop lag threshold
  },
  trackEventLoopLag: true, // Enable event loop monitoring
});
```

#### Methods

| Method                       | Description                          |
| ---------------------------- | ------------------------------------ |
| `ingest(event)`              | Process an action event              |
| `getFindings()`              | Get all detected findings            |
| `getSilentDegradations()`    | Get silent degradation findings only |
| `getFindingsByType(type)`    | Get findings of a specific type      |
| `getMetrics()`               | Get all action metrics               |
| `getMetricsByTrace(traceId)` | Get metrics for a trace              |
| `analyze()`                  | Re-run detection on all metrics      |
| `clear()`                    | Clear collected data                 |
| `destroy()`                  | Release resources                    |
| `stats()`                    | Get collector statistics             |

---

## Finding Types

| Type                 | Description                        |
| -------------------- | ---------------------------------- |
| `slow_action`        | Action exceeded duration threshold |
| `high_cpu`           | Action caused CPU spike            |
| `memory_spike`       | Action caused memory spike         |
| `event_loop_lag`     | Action blocked event loop          |
| `silent_degradation` | Action succeeded but degraded UX   |

## Finding Structure

```typescript
interface MetricFinding {
  type: FindingType;
  severity: "low" | "medium" | "high";
  traceId: string;
  actionId: string;
  actionName: string;
  message: string;
  details: Record<string, unknown>;
  metrics: ActionMetrics;
}
```

### Example Finding

```json
{
  "type": "silent_degradation",
  "severity": "high",
  "traceId": "abc123",
  "actionId": "action-456",
  "actionName": "ProcessPayment",
  "message": "Action \"ProcessPayment\" succeeded but degraded UX: slow (800ms > 500ms), high CPU (35%)",
  "details": {
    "issues": ["slow (800ms > 500ms)", "high CPU (35%)"],
    "durationMs": 800,
    "cpuDelta": 35,
    "memoryDeltaMb": 15
  }
}
```

---

## Resource Sampling

The `ResourceSampler` uses Node.js built-ins only:

| Metric         | Source                               |
| -------------- | ------------------------------------ |
| CPU Usage      | `process.cpuUsage()`                 |
| Memory RSS     | `process.memoryUsage().rss`          |
| Heap Used      | `process.memoryUsage().heapUsed`     |
| Event Loop Lag | `perf_hooks.monitorEventLoopDelay()` |

**No Prometheus. No OpenTelemetry. No external dependencies.**

### Direct Sampling

```typescript
import { ResourceSampler, calculateDelta } from "@causality/metrics-core";

const sampler = new ResourceSampler({ trackEventLoopLag: true });

const start = sampler.sample();
// ... heavy work ...
const end = sampler.sample();

const delta = calculateDelta(start, end);
console.log(`CPU delta: ${delta.cpuDelta}%`);
console.log(`Memory delta: ${delta.memoryDeltaMb}MB`);
```

---

## Detectors

Individual detectors can be used directly:

```typescript
import {
  detectSlowAction,
  detectHighCpu,
  detectMemorySpike,
  detectEventLoopLag,
  detectSilentDegradation,
  runAllDetectors,
} from "@causality/metrics-core";

const thresholds = { maxDurationMs: 500 };

const finding = detectSlowAction(metrics, thresholds);
if (finding) {
  console.log(finding.message);
}

// Or run all at once
const allFindings = runAllDetectors(metrics, thresholds);
```

---

## Reporters

### Console Reporter

```typescript
import { ConsoleReporter } from "@causality/metrics-core";

const reporter = new ConsoleReporter("medium"); // min severity
reporter.report(findings);
```

### In-Memory Reporter

```typescript
import { InMemoryReporter } from "@causality/metrics-core";

const reporter = new InMemoryReporter();
reporter.report(findings);

const silentDegradations = reporter.getSilentDegradations();
```

### Report Generation

```typescript
import { generateReport, formatReportText } from "@causality/metrics-core";

const report = generateReport(findings, traceId);
console.log(formatReportText(report));
```

---

## Integration with Collector

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";
import { createCollector } from "@causality/collector-core";
import { InMemoryStorage, TraceRepository } from "@causality/storage-core";
import { MetricsCollector } from "@causality/metrics-core";

// Setup
const storage = new InMemoryStorage();
const repo = new TraceRepository(storage);
const metrics = new MetricsCollector();

const collector = createCollector({
  transport: { send: async (trace) => storage.save(trace) },
});

onActionEvent((event) => {
  collector.ingest(event);
  metrics.ingest(event);
});

// Run actions
await runAction("CreateOrder", async () => {
  /* ... */
});

// Query degraded actions
const silentDegradations = metrics.getSilentDegradations();
for (const finding of silentDegradations) {
  console.log(`Warning: ${finding.message}`);
}
```

---

## Severity Calculation

Severity is calculated based on how much the threshold was exceeded:

| Ratio          | Severity |
| -------------- | -------- |
| > 3x threshold | High     |
| > 2x threshold | Medium   |
| > 1x threshold | Low      |

---

## Limitations

- **In-process only**: Metrics are collected in the same process
- **Not real-time**: Analysis happens after action completion
- **No persistence**: Metrics are in-memory only
- **No alerting**: Findings are passive, not pushed

These are intentional for Phase 3B. External integrations are planned for Phase 4.

---

## What This Package Does NOT Do

❌ Explain _why_ an action is slow (Phase 4: AI)  
❌ Suggest optimizations (Phase 4: AI)  
❌ Send alerts to Slack/PagerDuty  
❌ Export to Prometheus/OpenTelemetry

These are documented as inputs for Phase 4.

## Requirements

- Node.js >= 18.0.0
- @causality/sdk-core >= 0.1.0
- @causality/collector-core >= 0.1.0

## License

MIT
