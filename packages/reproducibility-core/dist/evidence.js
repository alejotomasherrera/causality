/**
 * @causality/reproducibility-core — Evidence Attribution
 *
 * Associates metrics and findings to each step in the causal chain.
 */
/**
 * Calculate aggregate metrics from all steps.
 */
export function calculateAggregateMetrics(steps, findings) {
    let totalDurationMs = 0;
    let totalCpuDelta = 0;
    let totalMemoryDeltaMb = 0;
    let maxCpuDelta = 0;
    let maxMemoryDeltaMb = 0;
    let maxEventLoopLagMs;
    let errorCount = 0;
    let degradedActionCount = 0;
    for (const step of steps) {
        if (step.durationMs) {
            totalDurationMs += step.durationMs;
        }
        if (step.metrics) {
            totalCpuDelta += step.metrics.cpuDelta;
            totalMemoryDeltaMb += step.metrics.memoryDeltaMb;
            maxCpuDelta = Math.max(maxCpuDelta, step.metrics.cpuDelta);
            maxMemoryDeltaMb = Math.max(maxMemoryDeltaMb, step.metrics.memoryDeltaMb);
            if (step.metrics.eventLoopLagMs !== undefined) {
                maxEventLoopLagMs = Math.max(maxEventLoopLagMs ?? 0, step.metrics.eventLoopLagMs);
            }
        }
        if (step.status === 'error') {
            errorCount++;
        }
        if (step.contributesToDegradation) {
            degradedActionCount++;
        }
    }
    return {
        totalDurationMs,
        totalCpuDelta,
        totalMemoryDeltaMb,
        maxCpuDelta,
        maxMemoryDeltaMb,
        maxEventLoopLagMs,
        actionCount: steps.length,
        errorCount,
        degradedActionCount,
    };
}
/**
 * Get the most impactful findings (by severity and type).
 */
export function getImpactfulFindings(findings, limit = 5) {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const typeOrder = {
        silent_degradation: 5,
        high_cpu: 4,
        memory_spike: 4,
        slow_action: 3,
        event_loop_lag: 2,
    };
    return [...findings]
        .sort((a, b) => {
        // First by severity
        const sevDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (sevDiff !== 0)
            return sevDiff;
        // Then by type importance
        const typeDiff = (typeOrder[b.type] ?? 0) - (typeOrder[a.type] ?? 0);
        return typeDiff;
    })
        .slice(0, limit);
}
/**
 * Get steps that contribute to the issue (have findings or errors).
 */
export function getContributingSteps(steps) {
    return steps.filter((step) => step.status === 'error' ||
        step.isFailurePoint ||
        step.contributesToDegradation ||
        step.findings.length > 0);
}
/**
 * Summarize evidence for the issue.
 */
export function summarizeEvidence(steps, findings) {
    const evidence = [];
    // Count errors
    const errorSteps = steps.filter((s) => s.status === 'error');
    if (errorSteps.length > 0) {
        const names = errorSteps.map((s) => s.name).join(', ');
        evidence.push(`${errorSteps.length} action(s) failed: ${names}`);
    }
    // Count slow actions
    const slowFindings = findings.filter((f) => f.type === 'slow_action');
    if (slowFindings.length > 0) {
        const maxDuration = Math.max(...slowFindings.map((f) => f.details.durationMs ?? 0));
        evidence.push(`${slowFindings.length} slow action(s), peak duration ${maxDuration}ms`);
    }
    // Count CPU spikes
    const cpuFindings = findings.filter((f) => f.type === 'high_cpu');
    if (cpuFindings.length > 0) {
        const maxCpu = Math.max(...cpuFindings.map((f) => f.details.cpuDelta ?? 0));
        evidence.push(`${cpuFindings.length} CPU spike(s), peak ${maxCpu.toFixed(1)}%`);
    }
    // Count memory spikes
    const memFindings = findings.filter((f) => f.type === 'memory_spike');
    if (memFindings.length > 0) {
        const maxMem = Math.max(...memFindings.map((f) => f.details.memoryDeltaMb ?? 0));
        evidence.push(`${memFindings.length} memory spike(s), peak ${maxMem.toFixed(1)}MB`);
    }
    // Silent degradations
    const silentFindings = findings.filter((f) => f.type === 'silent_degradation');
    if (silentFindings.length > 0) {
        evidence.push(`${silentFindings.length} silent degradation(s) detected`);
    }
    return evidence;
}
/**
 * Get the peak resource usage step.
 */
export function getPeakResourceStep(steps, metric) {
    let peak;
    let peakValue = -Infinity;
    for (const step of steps) {
        let value;
        switch (metric) {
            case 'cpu':
                value = step.metrics?.cpuDelta ?? 0;
                break;
            case 'memory':
                value = step.metrics?.memoryDeltaMb ?? 0;
                break;
            case 'duration':
                value = step.durationMs ?? 0;
                break;
        }
        if (value > peakValue) {
            peakValue = value;
            peak = step;
        }
    }
    return peak;
}
//# sourceMappingURL=evidence.js.map