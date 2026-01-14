# @causality/reproducibility-core

Reproducibility explanation engine for causal traces.

> **Phase 4A** — Reproducibility Explanation Core

## Overview

Transforms existing data (Trace + ActionMetrics + MetricFinding[]) into structured, deterministic explanations oriented toward **reproducing the issue**.

This package answers:

> "How can I intentionally reproduce this degradation?"

It does NOT:

- Use AI or probabilistic reasoning
- Read application source code
- Suggest fixes or optimizations

## Installation

```bash
npm install @causality/reproducibility-core
```

## Quick Start

```typescript
import { buildExplanation } from "@causality/reproducibility-core";

const explanation = buildExplanation({
  trace, // CausalityTrace from collector
  metrics, // ActionMetrics[] from metrics collector
  findings, // MetricFinding[] from detectors
});

console.log(explanation.summary);
// "Silent degradation in: "ProcessPayment". Peak duration: 800ms."

console.log(explanation.conditions.requiredInputs);
// [{ name: 'userId', value: 'u123', source: 'CreateOrder' }]

console.log(explanation.replayInstructions);
// Step-by-step instructions to reproduce
```

## Core Concepts

### ReproducibilityExplanation

The main output data structure:

```typescript
interface ReproducibilityExplanation {
  id: string; // Deterministic ID
  traceId: string; // Original trace
  issueType: IssueType; // Classification
  severity: IssueSeverity; // Priority
  summary: string; // Human-readable
  causalChain: CausalStep[]; // Ordered steps
  failurePoint?: CausalStep; // Where it broke/degraded
  conditions: ReproducibilityConditions;
  findings: MetricFinding[];
  aggregateMetrics: AggregateMetrics;
  replayInstructions: ReplayInstruction[];
}
```

### Issue Types

| Type                 | Description                     |
| -------------------- | ------------------------------- |
| `explicit_error`     | Action threw an error           |
| `degradation`        | Slow/resource-heavy with impact |
| `silent_degradation` | Succeeded but degraded UX       |
| `partial_trace`      | Incomplete trace data           |

### Causal Chain

Ordered sequence of steps reconstructed from the trace:

```typescript
interface CausalStep {
  order: number; // Execution order
  actionId: string;
  name: string;
  parentId?: string; // For nesting context
  depth: number; // Tree depth
  status: "ok" | "error" | "incomplete";
  metrics?: StepMetrics;
  findings: MetricFinding[];
  isFailurePoint: boolean;
  contributesToDegradation: boolean;
}
```

### Reproducibility Conditions

What's needed to reproduce the issue:

```typescript
interface ReproducibilityConditions {
  requiredInputs: RequiredInput[]; // Inputs to provide
  concurrencyLevel: number; // Parallel actions
  timingConstraints: TimingConstraint[];
  resourcePressure: ResourcePressure;
  loadCharacteristics: LoadCharacteristics;
}
```

### Replay Instructions

Step-by-step instructions for reproduction:

```typescript
interface ReplayInstruction {
  step: number;
  action: string;
  type: "execute" | "wait" | "verify" | "setup";
  description: string;
  inputs?: Record<string, unknown>;
  waitMs?: number;
}
```

## API Reference

### buildExplanation

Main entry point:

```typescript
import { buildExplanation } from "@causality/reproducibility-core";

const explanation = buildExplanation(
  {
    trace,
    metrics,
    findings,
  },
  {
    cpuPressureThreshold: 20,
    memoryPressureThreshold: 50,
    eventLoopLagThreshold: 100,
  }
);
```

### ExplanationBuilder

Builder class with helpers:

```typescript
import { ExplanationBuilder } from "@causality/reproducibility-core";

const builder = new ExplanationBuilder({ cpuPressureThreshold: 30 });

const explanation = builder.build({ trace, metrics, findings });

// Get reproducibility patterns
const patterns = builder.getPatterns(explanation);
// ["Requires concurrent load (5 parallel actions)", "Requires CPU stress"]

// Get contributing steps only
const contributing = builder.getContributingSteps(explanation);

// Get path to failure
const path = builder.getFailurePath(explanation);
```

### Causal Chain Utilities

```typescript
import {
  buildCausalChain,
  getExecutionPath,
  getParallelActions,
  calculateMaxConcurrency,
} from "@causality/reproducibility-core";

const chain = buildCausalChain(trace, metrics, findings);
const path = getExecutionPath(chain, "action-id");
const parallel = getParallelActions(chain);
const maxConcurrency = calculateMaxConcurrency(chain);
```

### Evidence Analysis

```typescript
import {
  calculateAggregateMetrics,
  getImpactfulFindings,
  getContributingSteps,
  summarizeEvidence,
} from "@causality/reproducibility-core";
```

### Condition Extraction

```typescript
import {
  extractConditions,
  inferReproducibilityPattern,
} from "@causality/reproducibility-core";

const conditions = extractConditions(causalChain, findings);
const patterns = inferReproducibilityPattern(conditions);
```

## Example Output

Given a successful-but-degrading trace:

```json
{
  "id": "repro-trace-pr",
  "traceId": "trace-prod-001",
  "issueType": "silent_degradation",
  "severity": "high",
  "summary": "Silent degradation in: \"ProcessPayment\". Peak duration: 800ms. Peak CPU: 40%.",
  "failurePoint": {
    "name": "ProcessPayment",
    "durationMs": 800,
    "status": "ok"
  },
  "conditions": {
    "requiredInputs": [
      { "name": "userId", "value": "u-12345" },
      { "name": "paymentMethod", "value": "credit_card" },
      { "name": "amount", "value": 99.99 }
    ],
    "concurrencyLevel": 1,
    "resourcePressure": {
      "cpuPressure": true,
      "peakCpuDelta": 40,
      "memoryPressure": true,
      "peakMemoryDeltaMb": 80
    }
  },
  "replayInstructions": [
    {
      "step": 1,
      "action": "setup",
      "type": "setup",
      "description": "Configure required inputs",
      "inputs": {
        "userId": "u-12345",
        "paymentMethod": "credit_card",
        "amount": 99.99
      }
    },
    {
      "step": 2,
      "action": "simulate_cpu_load",
      "type": "setup",
      "description": "Simulate CPU pressure (target: 40%)"
    },
    {
      "step": 3,
      "action": "CreateOrder",
      "type": "execute",
      "description": "Execute \"CreateOrder\""
    },
    {
      "step": 4,
      "action": "ProcessPayment",
      "type": "verify",
      "description": "Verify issue manifests at \"ProcessPayment\""
    }
  ]
}
```

## Guarantees

### Deterministic Output

Given identical inputs, produces identical outputs:

```typescript
const explanation1 = buildExplanation(input);
const explanation2 = buildExplanation(input);

// These are identical
explanation1.id === explanation2.id;
explanation1.causalChain === explanation2.causalChain;
```

### No AI / No Heuristics

All classification is based on:

- Explicit action status (error/ok)
- Threshold-based finding detection
- Structural analysis of trace

### No External Dependencies

Uses only:

- Node.js built-ins
- @causality/collector-core types
- @causality/metrics-core types

## Integration Example

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";
import { createCollector } from "@causality/collector-core";
import { InMemoryStorage, TraceRepository } from "@causality/storage-core";
import { MetricsCollector } from "@causality/metrics-core";
import { buildExplanation } from "@causality/reproducibility-core";

const storage = new InMemoryStorage();
const metricsCollector = new MetricsCollector();

const collector = createCollector({
  transport: { send: async (trace) => storage.save(trace) },
});

onActionEvent((event) => {
  collector.ingest(event);
  metricsCollector.ingest(event);
});

// Run actions...
await runAction("CreateOrder", async () => {
  /* ... */
});

await collector.flush();

// Get data
const traces = await storage.list();
for await (const trace of traces) {
  const metrics = metricsCollector.getMetricsByTrace(trace.traceId);
  const findings = metricsCollector.getFindingsByTrace?.(trace.traceId) ?? [];

  if (findings.length > 0) {
    const explanation = buildExplanation({ trace, metrics, findings });
    console.log(`Issue: ${explanation.summary}`);
    console.log(`Reproduce with: ${explanation.conditions.requiredInputs}`);
  }
}
```

## Requirements

- Node.js >= 18.0.0
- @causality/collector-core >= 0.1.0
- @causality/metrics-core >= 0.1.0

## License

MIT
