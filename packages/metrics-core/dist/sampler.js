/**
 * @causality/metrics-core — Resource Sampler
 *
 * Local resource sampling using Node.js built-ins.
 * No external dependencies (no Prometheus, no OpenTelemetry).
 */
import { cpuUsage, memoryUsage } from 'process';
import { monitorEventLoopDelay } from 'perf_hooks';
/**
 * Sample current system resources.
 * Uses only Node.js built-in APIs.
 */
export class ResourceSampler {
    lastCpuUsage = null;
    lastCpuTime = 0;
    eventLoopMonitor = null;
    constructor(options) {
        if (options?.trackEventLoopLag) {
            this.enableEventLoopMonitoring();
        }
    }
    /**
     * Take a snapshot of current resource usage.
     */
    sample() {
        const now = Date.now();
        const mem = memoryUsage();
        const cpu = this.sampleCpu();
        const snapshot = {
            timestamp: now,
            cpuUsage: cpu,
            memoryRssMb: mem.rss / (1024 * 1024),
            heapUsedMb: mem.heapUsed / (1024 * 1024),
        };
        // Add event loop lag if monitoring is enabled
        if (this.eventLoopMonitor) {
            const lagMs = this.eventLoopMonitor.mean / 1_000_000; // ns to ms
            return { ...snapshot, eventLoopLagMs: lagMs };
        }
        return snapshot;
    }
    /**
     * Enable event loop lag monitoring.
     */
    enableEventLoopMonitoring() {
        if (this.eventLoopMonitor)
            return;
        this.eventLoopMonitor = monitorEventLoopDelay({ resolution: 10 });
        this.eventLoopMonitor.enable();
    }
    /**
     * Disable event loop lag monitoring.
     */
    disableEventLoopMonitoring() {
        if (this.eventLoopMonitor) {
            this.eventLoopMonitor.disable();
            this.eventLoopMonitor = null;
        }
    }
    /**
     * Reset sampler state.
     */
    reset() {
        this.lastCpuUsage = null;
        this.lastCpuTime = 0;
        if (this.eventLoopMonitor) {
            this.eventLoopMonitor.reset();
        }
    }
    /**
     * Cleanup resources.
     */
    destroy() {
        this.disableEventLoopMonitoring();
    }
    /**
     * Sample CPU usage as percentage.
     * Calculates delta from last sample.
     */
    sampleCpu() {
        const now = Date.now();
        const currentCpu = cpuUsage(this.lastCpuUsage ?? undefined);
        if (!this.lastCpuUsage || this.lastCpuTime === 0) {
            // First sample - store and return 0
            this.lastCpuUsage = cpuUsage();
            this.lastCpuTime = now;
            return 0;
        }
        // Calculate CPU percentage
        // cpuUsage returns microseconds
        const elapsedMs = now - this.lastCpuTime;
        if (elapsedMs <= 0)
            return 0;
        const totalCpuMicros = currentCpu.user + currentCpu.system;
        const elapsedMicros = elapsedMs * 1000;
        // CPU percentage (can exceed 100% on multi-core)
        const cpuPercent = (totalCpuMicros / elapsedMicros) * 100;
        // Update state for next sample
        this.lastCpuUsage = cpuUsage();
        this.lastCpuTime = now;
        return Math.min(Math.max(cpuPercent, 0), 100);
    }
}
/**
 * Create a one-off snapshot without maintaining state.
 * Useful for simple sampling without CPU delta calculation.
 */
export function createSnapshot() {
    const now = Date.now();
    const mem = memoryUsage();
    return {
        timestamp: now,
        cpuUsage: 0, // Single sample can't calculate CPU %
        memoryRssMb: mem.rss / (1024 * 1024),
        heapUsedMb: mem.heapUsed / (1024 * 1024),
    };
}
/**
 * Calculate delta between two snapshots.
 */
export function calculateDelta(start, end) {
    return {
        durationMs: end.timestamp - start.timestamp,
        cpuDelta: end.cpuUsage - start.cpuUsage,
        memoryDeltaMb: end.memoryRssMb - start.memoryRssMb,
        heapDeltaMb: end.heapUsedMb - start.heapUsedMb,
        eventLoopLagDeltaMs: end.eventLoopLagMs !== undefined && start.eventLoopLagMs !== undefined
            ? end.eventLoopLagMs - start.eventLoopLagMs
            : undefined,
    };
}
//# sourceMappingURL=sampler.js.map