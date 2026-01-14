import { 
    CollectorTransport, 
    CausalityTrace 
} from '@causality/collector-core';

import { InMemoryStorage } from '@causality/storage-core';
import { MetricsCollector } from '@causality/metrics-core';
import { BehaviorAnalyzer } from '@causality/behavior-core';
import type { BehaviorAnalysisResult } from '@causality/behavior-core';
import { ImpactAssessor } from '@causality/impact-core';
import { CodeTracer, inferCodeContext, enrichExplanation } from '@causality/code-tracing-core';
import { Aggregator, generateReport } from '@causality/historical-core';
import { Predictor } from '@causality/predictive-core';
import { Analyzer as AIAnalyzer } from '@causality/ai-core';

// Alerting Hook
export type AlertHandler = (message: string) => void;

export class PipelineTransport implements CollectorTransport {
    name = 'PipelineTransport';

    constructor(
        private storage: InMemoryStorage,
        private metrics: MetricsCollector,
        private behavior: BehaviorAnalyzer,
        private impact: ImpactAssessor,
        private tracer: CodeTracer,
        private history: Aggregator,
        private predictor: Predictor,
        private ai: AIAnalyzer,
        private alertHandler?: AlertHandler
    ) {
        // Wire up predictive alerts
        this.predictor.onPrediction((p) => {
            if (p.riskLevel === 'critical' || p.riskLevel === 'high') {
                this.alertHandler?.(`🚨 PREDICTION: ${p.markdownReport}`);
            }
        });
    }

    async send(trace: CausalityTrace): Promise<void> {
        console.log(`[Pipeline] Processing trace: ${trace.traceId}`);

        // 1. Store Trace
        await this.storage.save(trace); 

        // 2. Map to Code
        const rootAction = trace.rootActions[0];
        const codeContext = inferCodeContext(rootAction.name); 
        
        // 3. Metrics Analysis
        const traceMetrics = this.metrics.getMetricsByTrace(trace.traceId);
        
        // 4. Behavior Analysis
        const behaviorResults: BehaviorAnalysisResult[] = [];
        for (const m of traceMetrics) {
             const context = {
                 actionName: m.name, 
                 traceId: m.traceId,
                 service: 'example-service'
             };
             
             // Analyze behavior
             const result = await this.behavior.analyzeWithStoredHistory(
                 context, 
                 m, 
                 {
                     file: codeContext.file || 'unknown',
                     function: codeContext.function || 'unknown'
                 }
             );
             if (result) {
                 behaviorResults.push(result);
             }
        }

        // 5. Create Explanation Bundle (Simulated Integration)
        
        // Let's assume we find a significant anomaly
        const sigBehavior = behaviorResults.find(b => b.anomaly.observedAnomaly) || behaviorResults[0];

        if (sigBehavior && sigBehavior.anomaly) {
             const anomaly = sigBehavior.anomaly; // Ensure it's defined

             if (anomaly.observedAnomaly) {
                 // 6. Historical Aggregation
                 const report = generateReport(this.history.getAllStats());
                 
                 // 7. Predictive Analysis
                 const predictions = this.predictor.predict({
                     historicalReport: report,
                     behaviorMetrics: behaviorResults,
                     impactAssessments: [], 
                     codeContext: [codeContext]
                 });

                 if (predictions.predictions.length > 0) {
                     this.alertHandler?.(`⚠️ Detected ${predictions.predictions.length} risks.`);
                 }
             }
        }
    }
}
