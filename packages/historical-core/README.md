# @causality/historical-core

Historical aggregation and trend analysis for Causality.

> **Phase 8** — Historical & Trend Analysis Core

## Overview

Aggregates `EnrichedExplanation` traces to:

- **Identify Trends:** Is a service getting slower or more error-prone?
- **Detect Silent Degradations:** Success rate is high, but resources/latency are worsening.
- **Prioritize Issues:** Rank problems by frequency and impact.
- **Generate Reports:** Structure data for AI analysis or dashboards.

## Installation

```bash
npm install @causality/historical-core
```

## Usage

```typescript
import { Aggregator, generateReport } from "@causality/historical-core";

const aggregator = new Aggregator();

// Process traces as they arrive
aggregator.process(enrichedTrace1);
aggregator.process(enrichedTrace2);

// Generate report
const report = generateReport(aggregator.getAllStats());

console.log(JSON.stringify(report, null, 2));
/*
{
  "items": [
    {
      "microservice": "payment-service",
      "function": "processPayment",
      "totalFailures": 5,
      "trend": "degrading",
      "recommendedAttention": "ops",
      ...
    }
  ]
}
*/
```

## Key Components

### Aggregator

Groups traces by `service::function::action`. Maintains a sliding window of recent history.

### Trend Analyzer

Analyzes the history window to determine if metrics are improving, stable, or degrading.

- **Degradation Detection:** >20% worsening in recent half of window.
- **Silent Degradation:** Stable success rate but worsening duration.

### Reporter

Outputs a structured JSON report classifying items by recommended attention:

- **Ops:** High failure rate (>10%).
- **Developer:** Logic issues or silent degradation.
- **Product:** High degradation rate (>20%).
- **None:** Healthy.

## License

MIT
