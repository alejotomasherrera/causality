# @causality/ai-core

AI-driven insights and pattern recognition for Causality.

> **Phase 9** — AI Core

## Overview

Leverages AI models (LLMs) to analyze historical data and provide human-readable insights.

- **Model Agnostic:** Works with OpenAI, Gemini, Local models, or tailored mocks.
- **Semantic Analysis:** Goes beyond numbers to suggest _why_ something is failing.
- **Actionable Insights:** Categorizes issues by Security, Performance, Reliability, Architecture.

## Installation

```bash
npm install @causality/ai-core
```

## Usage

```typescript
import { Analyzer, toMarkdown } from "@causality/ai-core";

// 1. Configure the analyzer
const analyzer = new Analyzer({
  provider: "mock", // or 'openai'
  model: "gpt-4",
});

// 2. Feed it a historical report (from @causality/historical-core)
const result = await analyzer.analyze({
  report: historicalReport,
  context: "Focus on recent changes to payment-service deployment.",
});

// 3. Get insights
console.log(result.summary);
// "Analysis indicates degrading performance..."

console.log(toMarkdown(result));
// # AI Analysis Report ...
```

## Components

### Analyzer

Main entry point. Orchestrates the flow between the data, the model adapter, and the insight generator.

### ModelAdapter

Abstract interface to plug in any LLM.

- Included: `MockModelAdapter` (for testing/dev)
- Extensible for `OpenAI`, `VertexAI`, etc.

### InsightGenerator

Converts raw LLM text into structured `Insight` objects, validating the JSON format.

## License

MIT
