/**
 * @causality/predictive-core — Predictor
 *
 * Orchestrates predictive analysis.
 */
import { matchPatterns } from './pattern-matcher.js';
import { assessRisk } from './risk-assessor.js';
import { generateRecommendation } from './recommendation-engine.js';
import { randomUUID } from 'crypto';
export class Predictor {
    listeners = [];
    /**
     * Register a callback for new predictions.
     */
    onPrediction(callback) {
        this.listeners.push(callback);
    }
    /**
     * Run predictive analysis based on historical input.
     */
    predict(input) {
        const predictions = [];
        // Map code context for quick lookup
        const codeMap = new Map(input.codeContext.map(c => [c.actionName, c]));
        for (const item of input.historicalReport.items) {
            const patterns = matchPatterns(item);
            if (patterns.length === 0 && item.recommendedAttention === 'none') {
                continue;
            }
            const risk = assessRisk(item, patterns);
            if (risk.severity === 'low' && risk.confidence < 0.8) {
                continue;
            }
            const predictedIssue = patterns.length > 0 ? patterns[0].issue : 'potential_issue';
            const recommendation = generateRecommendation(risk.category, risk.severity, predictedIssue, item.actionName);
            // Lookup code context or fallback
            const codeCtx = codeMap.get(item.actionName);
            const file = codeCtx?.file ?? `src/${item.microservice}/${item.function}.ts`;
            const functionName = codeCtx?.function ?? item.function;
            const prediction = {
                predictionId: randomUUID(),
                tracePattern: `${predictedIssue} ${item.actionName}`,
                impactedService: item.microservice,
                file,
                function: functionName,
                observedTrend: item.trend,
                riskLevel: risk.severity,
                category: risk.category,
                confidence: risk.confidence,
                recommendedActions: [recommendation],
                impactForecast: {
                    durationMsIncrease: risk.category === 'performance' ? 50 : 0, // Simplified model
                    usersAffected: risk.expectedImpact, // Use impact score as proxy for now
                },
                timestamp: new Date().toISOString(),
                markdownReport: `**${risk.severity.toUpperCase()}** risk in \`${item.actionName}\`: ${predictedIssue}. ${recommendation}`
            };
            predictions.push(prediction);
            // Emit event
            this.emitPrediction(prediction);
        }
        predictions.sort((a, b) => {
            const scores = { critical: 4, high: 3, medium: 2, low: 1 };
            return scores[b.riskLevel] - scores[a.riskLevel];
        });
        return {
            generatedAt: Date.now(),
            predictions,
            summaryMarkdown: this.generateSummary(predictions)
        };
    }
    emitPrediction(prediction) {
        for (const listener of this.listeners) {
            try {
                listener(prediction);
            }
            catch (err) {
                console.error("Error in onPrediction listener:", err);
            }
        }
    }
    generateSummary(predictions) {
        if (predictions.length === 0) {
            return "# Predictive Analysis Report\nNo significant risks predicted.";
        }
        const critical = predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
        let md = "# Predictive Analysis Report\n";
        if (critical.length > 0) {
            md += "## 🚨 High Risk Functions\n";
            for (const p of critical) {
                md += `- ${p.markdownReport}\n`;
            }
        }
        const others = predictions.filter(p => p.riskLevel === 'medium');
        if (others.length > 0) {
            md += "\n## ⚠️ Potential Issues\n";
            for (const p of others) {
                md += `- **${p.impactedService}::${p.function}**: ${p.tracePattern}\n`;
            }
        }
        return md;
    }
}
//# sourceMappingURL=predictor.js.map