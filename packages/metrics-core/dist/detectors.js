/**
 * @causality/metrics-core — Detectors
 *
 * Threshold-based detection of performance issues.
 * Deterministic, no AI, no heuristics.
 */
/**
 * Detect slow action based on duration threshold.
 */
export function detectSlowAction(metrics, thresholds) {
    const maxDuration = thresholds.maxDurationMs ?? 500;
    if (metrics.durationMs <= maxDuration) {
        return null;
    }
    const severity = calculateDurationSeverity(metrics.durationMs, maxDuration);
    return {
        type: 'slow_action',
        severity,
        traceId: metrics.traceId,
        actionId: metrics.actionId,
        actionName: metrics.name,
        message: `Action "${metrics.name}" took ${metrics.durationMs}ms (threshold: ${maxDuration}ms)`,
        details: {
            durationMs: metrics.durationMs,
            threshold: maxDuration,
            exceededBy: metrics.durationMs - maxDuration,
        },
        metrics,
    };
}
/**
 * Detect high CPU usage spike during action.
 */
export function detectHighCpu(metrics, thresholds) {
    const maxCpuDelta = thresholds.maxCpuDelta ?? 20;
    const cpuDelta = metrics.metrics.delta.cpuDelta;
    if (cpuDelta <= maxCpuDelta) {
        return null;
    }
    const severity = calculateCpuSeverity(cpuDelta, maxCpuDelta);
    return {
        type: 'high_cpu',
        severity,
        traceId: metrics.traceId,
        actionId: metrics.actionId,
        actionName: metrics.name,
        message: `Action "${metrics.name}" caused CPU spike of ${cpuDelta.toFixed(1)}% (threshold: ${maxCpuDelta}%)`,
        details: {
            cpuDelta,
            threshold: maxCpuDelta,
            startCpu: metrics.metrics.start.cpuUsage,
            endCpu: metrics.metrics.end.cpuUsage,
        },
        metrics,
    };
}
/**
 * Detect memory spike during action.
 */
export function detectMemorySpike(metrics, thresholds) {
    const maxMemoryDelta = thresholds.maxMemoryDeltaMb ?? 50;
    const memoryDelta = metrics.metrics.delta.memoryDeltaMb;
    if (memoryDelta <= maxMemoryDelta) {
        return null;
    }
    const severity = calculateMemorySeverity(memoryDelta, maxMemoryDelta);
    return {
        type: 'memory_spike',
        severity,
        traceId: metrics.traceId,
        actionId: metrics.actionId,
        actionName: metrics.name,
        message: `Action "${metrics.name}" caused memory spike of ${memoryDelta.toFixed(1)}MB (threshold: ${maxMemoryDelta}MB)`,
        details: {
            memoryDeltaMb: memoryDelta,
            threshold: maxMemoryDelta,
            startMemoryMb: metrics.metrics.start.memoryRssMb,
            endMemoryMb: metrics.metrics.end.memoryRssMb,
        },
        metrics,
    };
}
/**
 * Detect event loop lag.
 */
export function detectEventLoopLag(metrics, thresholds) {
    const maxLag = thresholds.maxEventLoopLagMs ?? 100;
    const endLag = metrics.metrics.end.eventLoopLagMs;
    if (endLag === undefined || endLag <= maxLag) {
        return null;
    }
    const severity = endLag > maxLag * 3 ? 'high' : endLag > maxLag * 2 ? 'medium' : 'low';
    return {
        type: 'event_loop_lag',
        severity,
        traceId: metrics.traceId,
        actionId: metrics.actionId,
        actionName: metrics.name,
        message: `Action "${metrics.name}" caused event loop lag of ${endLag.toFixed(1)}ms (threshold: ${maxLag}ms)`,
        details: {
            eventLoopLagMs: endLag,
            threshold: maxLag,
        },
        metrics,
    };
}
/**
 * Detect silent degradation: action succeeded but had poor performance.
 * This is the key finding type for Phase 3B.
 */
export function detectSilentDegradation(metrics, thresholds) {
    // Only applies to successful actions
    if (metrics.status !== 'ok') {
        return null;
    }
    const issues = [];
    let maxSeverity = 'low';
    // Check each threshold
    const maxDuration = thresholds.maxDurationMs ?? 500;
    if (metrics.durationMs > maxDuration) {
        issues.push(`slow (${metrics.durationMs}ms > ${maxDuration}ms)`);
        if (metrics.durationMs > maxDuration * 2)
            maxSeverity = 'high';
        else if (metrics.durationMs > maxDuration * 1.5)
            maxSeverity = 'medium';
    }
    const maxCpu = thresholds.maxCpuDelta ?? 20;
    if (metrics.metrics.delta.cpuDelta > maxCpu) {
        issues.push(`high CPU (${metrics.metrics.delta.cpuDelta.toFixed(1)}%)`);
        if (metrics.metrics.delta.cpuDelta > maxCpu * 2 && maxSeverity !== 'high') {
            maxSeverity = 'high';
        }
    }
    const maxMem = thresholds.maxMemoryDeltaMb ?? 50;
    if (metrics.metrics.delta.memoryDeltaMb > maxMem) {
        issues.push(`memory spike (${metrics.metrics.delta.memoryDeltaMb.toFixed(1)}MB)`);
        if (metrics.metrics.delta.memoryDeltaMb > maxMem * 2 && maxSeverity !== 'high') {
            maxSeverity = 'high';
        }
    }
    if (issues.length === 0) {
        return null;
    }
    return {
        type: 'silent_degradation',
        severity: maxSeverity,
        traceId: metrics.traceId,
        actionId: metrics.actionId,
        actionName: metrics.name,
        message: `Action "${metrics.name}" succeeded but degraded UX: ${issues.join(', ')}`,
        details: {
            issues,
            durationMs: metrics.durationMs,
            cpuDelta: metrics.metrics.delta.cpuDelta,
            memoryDeltaMb: metrics.metrics.delta.memoryDeltaMb,
            thresholds: {
                maxDurationMs: maxDuration,
                maxCpuDelta: maxCpu,
                maxMemoryDeltaMb: maxMem,
            },
        },
        metrics,
    };
}
/**
 * Run all detectors on an action.
 */
export function runAllDetectors(metrics, thresholds) {
    const findings = [];
    const slow = detectSlowAction(metrics, thresholds);
    if (slow)
        findings.push(slow);
    const cpu = detectHighCpu(metrics, thresholds);
    if (cpu)
        findings.push(cpu);
    const memory = detectMemorySpike(metrics, thresholds);
    if (memory)
        findings.push(memory);
    const lag = detectEventLoopLag(metrics, thresholds);
    if (lag)
        findings.push(lag);
    const silent = detectSilentDegradation(metrics, thresholds);
    if (silent)
        findings.push(silent);
    return findings;
}
// --- Severity helpers ---
function calculateDurationSeverity(actual, threshold) {
    const ratio = actual / threshold;
    if (ratio > 3)
        return 'high';
    if (ratio > 2)
        return 'medium';
    return 'low';
}
function calculateCpuSeverity(actual, threshold) {
    const ratio = actual / threshold;
    if (ratio > 3)
        return 'high';
    if (ratio > 2)
        return 'medium';
    return 'low';
}
function calculateMemorySeverity(actual, threshold) {
    const ratio = actual / threshold;
    if (ratio > 3)
        return 'high';
    if (ratio > 2)
        return 'medium';
    return 'low';
}
//# sourceMappingURL=detectors.js.map