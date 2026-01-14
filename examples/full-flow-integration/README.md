# Causality Integration Example

This example demonstrates the full capabilities of the Causality Framework (Phases 1-10).
It simulates a microservice (`ProcessPayment`) experiencing degradation and failure, and shows how the pipeline captures, analyzes, and predicts issues.

## Prerequisites

- Node.js 18+
- Use `scripts/build-all.sh` to build all local packages first.

## Running the Example

1. **Install dependencies:**

   ```bash
   cd examples/full-flow-integration
   npm install
   ```

2. **Run the simulation:**
   ```bash
   npm start
   ```

## What you will see

1.  **Normal Traffic:** Traces are captured and stored.
2.  **Degradation:** Latency increases. `BehaviorCore` detects deviation. `HistoricalCore` registers trend.
3.  **Prediction:** `PredictiveCore` detects the degradation pattern and triggers an alert via the `onPrediction` hook.
4.  **Alert:** A simulated Discord message appears in the console: `💬 [DISCORD]: 🚨 PREDICTION: ...`

## Pipeline Architecture

The `PipelineTransport` (`src/pipeline.ts`) orchestrates the flow:
`Trace` -> `Metrics` -> `Behavior` -> `Impact` -> `Historical` -> `AI/Predictive` -> `Alert`.
