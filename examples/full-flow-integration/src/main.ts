import { runAction, onActionEvent } from '@causality/sdk-core';
import { createCollector, ConsoleTransport } from '@causality/collector-core';
import { InMemoryStorage } from '@causality/storage-core';
import { MetricsCollector } from '@causality/metrics-core';
import { BehaviorAnalyzer } from '@causality/behavior-core';
import { ImpactAssessor } from '@causality/impact-core';
import { CodeTracer } from '@causality/code-tracing-core';
import { Aggregator } from '@causality/historical-core';
import { Predictor } from '@causality/predictive-core';
import { Analyzer as AIAnalyzer } from '@causality/ai-core';

import { PipelineTransport } from './pipeline.js';

// Setup Mock Alert
const discordWebhook = (msg: string) => console.log(`\n💬 [DISCORD]: ${msg}\n`);

// Initialize Cores
const storage = new InMemoryStorage();
const metrics = new MetricsCollector();
const behavior = new BehaviorAnalyzer();
const impact = new ImpactAssessor();
const tracer = new CodeTracer(); // removed config
const history = new Aggregator();
const predictor = new Predictor();
const ai = new AIAnalyzer({ provider: 'mock', model: 'gpt-4' });

// Initialize Pipeline
const pipeline = new PipelineTransport(
    storage,
    metrics,
    behavior,
    impact,
    tracer,
    history,
    predictor,
    ai,
    discordWebhook
);

// Initialize Collector with Pipeline
const collector = createCollector({
    flushIntervalMs: 1000,
    transport: pipeline
});

// Hook SDK
onActionEvent(event => {
    collector.ingest(event);
    metrics.ingest(event); // Hook metrics as well
});

// --- Simulation ---

async function main() {
    console.log("🚀 Starting Causality Integration Example...");

    // 1. Simulate Normal Traffic
    console.log("\n--- Phase 1: Normal Traffic ---");
    for (let i = 0; i < 5; i++) {
        await runAction('ProcessPayment', async () => {
            await new Promise(r => setTimeout(r, 100)); // 100ms duration
        });
    }

    // 2. Simulate Degradation (Latency Spike)
    console.log("\n--- Phase 2: Degradation (Latency Spike) ---");
    for (let i = 0; i < 5; i++) {
        await runAction('ProcessPayment', async () => {
            await new Promise(r => setTimeout(r, 500)); // 500ms duration
        });
    }

    // 3. Simulate Failure
    console.log("\n--- Phase 3: Critical Failure ---");
    try {
        await runAction('ProcessPayment', async () => {
             throw new Error("DB Connection Failed");
        });
    } catch (e) {
        // ignore
    }

    // Allow time for flush
    await new Promise(r => setTimeout(r, 2000));
    console.log("✅ Simulation Complete.");
}

main().catch(console.error);
