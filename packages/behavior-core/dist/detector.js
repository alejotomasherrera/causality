/**
 * @causality/behavior-core — Anomaly Detector
 *
 * Compare observed metrics against historical baseline.
 * Deterministic detection based on statistical thresholds.
 */
import { calculateBaseline, calculateDeviation, calculateConfidence, } from './baseline.js';
import { classifySensitivity } from './sensitivity.js';
/**
 * Detect anomalies by comparing current metrics to history.
 */
export function detectAnomaly(metrics, history, source, occurrenceCount, config) {
    const cfg = {
        minSamplesForBaseline: config?.minSamplesForBaseline ?? 10,
        stdDevThreshold: config?.stdDevThreshold ?? 2.0,
        minOccurrencesToFlag: config?.minOccurrencesToFlag ?? 3,
        confidenceThreshold: config?.confidenceThreshold ?? 0.7,
    };
    const observed = {
        durationMs: metrics.durationMs,
        cpuDelta: metrics.metrics.delta.cpuDelta,
        memoryDeltaMb: metrics.metrics.delta.memoryDeltaMb,
        eventLoopLagMs: metrics.metrics.end.eventLoopLagMs,
    };
    const expected = calculateBaseline(history);
    // Calculate deviations
    const durationDev = calculateDeviation(observed.durationMs, history.stats.duration);
    const cpuDev = calculateDeviation(observed.cpuDelta, history.stats.cpu);
    const memoryDev = calculateDeviation(observed.memoryDeltaMb, history.stats.memory);
    // Determine anomaly type
    const anomalyType = determineAnomalyType(durationDev, cpuDev, memoryDev, cfg.stdDevThreshold);
    // Maximum deviation magnitude
    const deviationMagnitude = Math.max(Math.abs(durationDev), Math.abs(cpuDev), Math.abs(memoryDev));
    // Is it an anomaly?
    const observedAnomaly = anomalyType !== undefined;
    // Calculate confidence
    const confidence = observedAnomaly
        ? calculateConfidence(history.sampleCount, deviationMagnitude, cfg.minSamplesForBaseline)
        : 0;
    // Classify sensitivity
    const repeatSensitivity = classifySensitivity(occurrenceCount, confidence, cfg.minOccurrencesToFlag, cfg.confidenceThreshold);
    // Generate reason
    const reason = generateReason(anomalyType, observed, expected, deviationMagnitude, history);
    return {
        actionName: metrics.name,
        file: source.file,
        function: source.function,
        metricsObserved: observed,
        metricsExpected: expected,
        observedAnomaly,
        confidence,
        repeatSensitivity,
        reason,
        anomalyType,
        deviationMagnitude,
    };
}
/**
 * Determine the type of anomaly based on deviations.
 */
function determineAnomalyType(durationDev, cpuDev, memoryDev, threshold) {
    const durationAnomaly = durationDev > threshold;
    const cpuAnomaly = cpuDev > threshold;
    const memoryAnomaly = memoryDev > threshold;
    const anomalyCount = [durationAnomaly, cpuAnomaly, memoryAnomaly].filter(Boolean).length;
    if (anomalyCount === 0) {
        return undefined;
    }
    if (anomalyCount >= 2) {
        return 'combined_anomaly';
    }
    if (durationAnomaly)
        return 'latency_spike';
    if (cpuAnomaly)
        return 'cpu_anomaly';
    if (memoryAnomaly)
        return 'memory_anomaly';
    return undefined;
}
/**
 * Generate human-readable reason for the anomaly.
 */
function generateReason(anomalyType, observed, expected, deviation, history) {
    if (!anomalyType) {
        return 'No anomaly detected. Metrics within expected range.';
    }
    const parts = [];
    switch (anomalyType) {
        case 'latency_spike':
            parts.push(`Latency ${observed.durationMs}ms exceeds expected ${Math.round(expected.durationMs)}ms`);
            parts.push(`(${deviation.toFixed(1)}σ above mean ${Math.round(history.stats.duration.mean)}ms)`);
            break;
        case 'cpu_anomaly':
            parts.push(`CPU delta ${observed.cpuDelta.toFixed(1)}% exceeds expected ${expected.cpu} usage`);
            parts.push(`(${deviation.toFixed(1)}σ above mean ${history.stats.cpu.mean.toFixed(1)}%)`);
            break;
        case 'memory_anomaly':
            parts.push(`Memory delta ${observed.memoryDeltaMb.toFixed(1)}MB exceeds expected ${expected.memory} usage`);
            parts.push(`(${deviation.toFixed(1)}σ above mean ${history.stats.memory.mean.toFixed(1)}MB)`);
            break;
        case 'combined_anomaly':
            parts.push('Multiple resource anomalies detected:');
            if (observed.durationMs > expected.thresholds.durationP95) {
                parts.push(`latency ${observed.durationMs}ms > p95 ${Math.round(expected.thresholds.durationP95)}ms`);
            }
            if (observed.cpuDelta > expected.thresholds.cpuP95) {
                parts.push(`CPU ${observed.cpuDelta.toFixed(1)}% > p95 ${expected.thresholds.cpuP95.toFixed(1)}%`);
            }
            if (observed.memoryDeltaMb > expected.thresholds.memoryP95) {
                parts.push(`memory ${observed.memoryDeltaMb.toFixed(1)}MB > p95 ${expected.thresholds.memoryP95.toFixed(1)}MB`);
            }
            break;
    }
    return parts.join(' ');
}
/**
 * Quick check if metrics are anomalous without full analysis.
 */
export function isAnomalous(metrics, history, stdDevThreshold = 2.0) {
    const durationDev = calculateDeviation(metrics.durationMs, history.stats.duration);
    const cpuDev = calculateDeviation(metrics.metrics.delta.cpuDelta, history.stats.cpu);
    const memoryDev = calculateDeviation(metrics.metrics.delta.memoryDeltaMb, history.stats.memory);
    return (durationDev > stdDevThreshold ||
        cpuDev > stdDevThreshold ||
        memoryDev > stdDevThreshold);
}
//# sourceMappingURL=detector.js.map