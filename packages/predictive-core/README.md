# @causality/predictive-core

Predictive analysis and auto-learning for Causality.

> **Phase 10** — Predictive & Auto-Learning Core

## Overview

Analyzes historical patterns to anticipate problems before they affect users.

- **Pattern Matcher:** Detects recurring anomalies and degradation trends.
- **Risk Assessor:** Calculates severity and confidence of potential issues.
- **Recommendation Engine:** Generates preventive actions (e.g., "Optimize DB queries").
- **Predictor:** Outputs structured predictions for integration with Impact Core.

## Installation

```bash
npm install @causality/predictive-core
```

## Usage

```typescript
import { Predictor } from "@causality/predictive-core";

const predictor = new Predictor();

const report = predictor.predict({
  historicalReport: historicalData, // from @causality/historical-core
  context: {
    timeWindow: "last 7 days",
  },
});

console.log(report.summaryMarkdown);
// # Predictive Analysis Report
// ## 🚨 High Risk Functions
// - **ProcessPayment** in `payment-service`: latency_spike. Review DB queries...
```

## How It Works

1.  **Input:** Historical report with aggregated stats and trends.
2.  **Pattern Matching:** Checks for hard-coded patterns (e.g., specific error spikes, degradation slopes).
3.  **Risk Assessment:** Assigns severity (Low -> Critical) based on impact and confidence.
4.  **Output:** A list of `Prediction` objects and a Markdown summary.

## License

MIT
