/**
 * @causality/reproducibility-core — Reproducibility Conditions
 *
 * Extracts conditions required to reproduce the issue.
 */
import { calculateMaxConcurrency, getParallelActions } from './causal-chain.js';
/**
 * Extract reproducibility conditions from the causal chain.
 */
export function extractConditions(steps, findings, config) {
    const cpuThreshold = config?.cpuPressureThreshold ?? 20;
    const memThreshold = config?.memoryPressureThreshold ?? 50;
    const lagThreshold = config?.eventLoopLagThreshold ?? 100;
    return {
        requiredInputs: extractRequiredInputs(steps),
        concurrencyLevel: calculateMaxConcurrency(steps),
        timingConstraints: extractTimingConstraints(steps),
        resourcePressure: extractResourcePressure(steps, cpuThreshold, memThreshold, lagThreshold),
        loadCharacteristics: extractLoadCharacteristics(steps),
    };
}
/**
 * Extract required inputs from action attributes.
 */
function extractRequiredInputs(steps) {
    const inputs = [];
    const seen = new Set();
    for (const step of steps) {
        if (!step.attributes)
            continue;
        for (const [key, value] of Object.entries(step.attributes)) {
            // Skip internal attributes
            if (key.startsWith('_'))
                continue;
            // Skip already seen
            const inputKey = `${key}:${JSON.stringify(value)}`;
            if (seen.has(inputKey))
                continue;
            seen.add(inputKey);
            inputs.push({
                name: key,
                value,
                source: step.name,
                actionId: step.actionId,
            });
        }
    }
    return inputs;
}
/**
 * Extract timing constraints (sequential vs parallel execution).
 */
function extractTimingConstraints(steps) {
    const constraints = [];
    // Find parallel action groups
    const parallelGroups = getParallelActions(steps);
    for (const group of parallelGroups) {
        constraints.push({
            type: 'parallel',
            actionIds: group.map((s) => s.actionId),
            description: `Actions execute in parallel: ${group.map((s) => s.name).join(', ')}`,
        });
    }
    // Find sequential dependencies (parent-child)
    const childrenByParent = new Map();
    for (const step of steps) {
        if (step.parentId) {
            const children = childrenByParent.get(step.parentId) ?? [];
            children.push(step);
            childrenByParent.set(step.parentId, children);
        }
    }
    for (const [parentId, children] of childrenByParent) {
        const parent = steps.find((s) => s.actionId === parentId);
        if (!parent || children.length <= 1)
            continue;
        // Sort children by start time
        const sorted = [...children].sort((a, b) => a.startTime - b.startTime);
        // Check for significant delays between children
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            if (prev.endTime) {
                const delay = curr.startTime - prev.endTime;
                if (delay >= 10) { // 10ms threshold
                    constraints.push({
                        type: 'delayed',
                        actionIds: [prev.actionId, curr.actionId],
                        description: `${prev.name} completes ${delay}ms before ${curr.name} starts`,
                        delayMs: delay,
                    });
                }
            }
        }
    }
    return constraints;
}
/**
 * Extract resource pressure signals.
 */
function extractResourcePressure(steps, cpuThreshold, memThreshold, lagThreshold) {
    let peakCpuDelta = 0;
    let peakMemoryDeltaMb = 0;
    let peakEventLoopLagMs;
    for (const step of steps) {
        if (!step.metrics)
            continue;
        peakCpuDelta = Math.max(peakCpuDelta, step.metrics.cpuDelta);
        peakMemoryDeltaMb = Math.max(peakMemoryDeltaMb, step.metrics.memoryDeltaMb);
        if (step.metrics.eventLoopLagMs !== undefined) {
            peakEventLoopLagMs = Math.max(peakEventLoopLagMs ?? 0, step.metrics.eventLoopLagMs);
        }
    }
    return {
        cpuPressure: peakCpuDelta >= cpuThreshold,
        peakCpuDelta,
        memoryPressure: peakMemoryDeltaMb >= memThreshold,
        peakMemoryDeltaMb,
        eventLoopBlocked: (peakEventLoopLagMs ?? 0) >= lagThreshold,
        peakEventLoopLagMs,
    };
}
/**
 * Extract load characteristics.
 */
function extractLoadCharacteristics(steps) {
    if (steps.length === 0) {
        return {
            totalActions: 0,
            maxConcurrentActions: 0,
            traceDurationMs: 0,
            actionsPerSecond: 0,
        };
    }
    const minStart = Math.min(...steps.map((s) => s.startTime));
    const maxEnd = Math.max(...steps.map((s) => s.endTime ?? s.startTime));
    const traceDurationMs = maxEnd - minStart;
    const maxConcurrentActions = calculateMaxConcurrency(steps);
    const actionsPerSecond = traceDurationMs > 0
        ? (steps.length / traceDurationMs) * 1000
        : steps.length;
    return {
        totalActions: steps.length,
        maxConcurrentActions,
        traceDurationMs,
        actionsPerSecond,
    };
}
/**
 * Check if conditions indicate a reproducibility pattern.
 */
export function inferReproducibilityPattern(conditions) {
    const patterns = [];
    // High concurrency
    if (conditions.concurrencyLevel >= 3) {
        patterns.push(`Requires concurrent load (${conditions.concurrencyLevel} parallel actions)`);
    }
    // CPU pressure
    if (conditions.resourcePressure.cpuPressure) {
        patterns.push(`Requires CPU stress (peak ${conditions.resourcePressure.peakCpuDelta.toFixed(1)}%)`);
    }
    // Memory pressure
    if (conditions.resourcePressure.memoryPressure) {
        patterns.push(`Requires memory pressure (peak ${conditions.resourcePressure.peakMemoryDeltaMb.toFixed(1)}MB)`);
    }
    // Event loop blocking
    if (conditions.resourcePressure.eventLoopBlocked) {
        patterns.push(`Requires blocking operation (lag ${conditions.resourcePressure.peakEventLoopLagMs?.toFixed(1)}ms)`);
    }
    // Specific inputs
    if (conditions.requiredInputs.length > 0) {
        const inputNames = conditions.requiredInputs.map((i) => i.name).join(', ');
        patterns.push(`Requires specific inputs: ${inputNames}`);
    }
    // Timing constraints
    const parallelConstraints = conditions.timingConstraints.filter((c) => c.type === 'parallel');
    if (parallelConstraints.length > 0) {
        patterns.push(`Requires parallel execution of multiple actions`);
    }
    const delayConstraints = conditions.timingConstraints.filter((c) => c.type === 'delayed');
    if (delayConstraints.length > 0) {
        patterns.push(`Requires specific timing between actions`);
    }
    return patterns;
}
//# sourceMappingURL=conditions.js.map