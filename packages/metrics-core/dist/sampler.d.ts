/**
 * @causality/metrics-core — Resource Sampler
 *
 * Local resource sampling using Node.js built-ins.
 * No external dependencies (no Prometheus, no OpenTelemetry).
 */
import type { MetricSnapshot } from './types.js';
/**
 * Sample current system resources.
 * Uses only Node.js built-in APIs.
 */
export declare class ResourceSampler {
    private lastCpuUsage;
    private lastCpuTime;
    private eventLoopMonitor;
    constructor(options?: {
        trackEventLoopLag?: boolean;
    });
    /**
     * Take a snapshot of current resource usage.
     */
    sample(): MetricSnapshot;
    /**
     * Enable event loop lag monitoring.
     */
    enableEventLoopMonitoring(): void;
    /**
     * Disable event loop lag monitoring.
     */
    disableEventLoopMonitoring(): void;
    /**
     * Reset sampler state.
     */
    reset(): void;
    /**
     * Cleanup resources.
     */
    destroy(): void;
    /**
     * Sample CPU usage as percentage.
     * Calculates delta from last sample.
     */
    private sampleCpu;
}
/**
 * Create a one-off snapshot without maintaining state.
 * Useful for simple sampling without CPU delta calculation.
 */
export declare function createSnapshot(): MetricSnapshot;
/**
 * Calculate delta between two snapshots.
 */
export declare function calculateDelta(start: MetricSnapshot, end: MetricSnapshot): import('./types.js').MetricDelta;
//# sourceMappingURL=sampler.d.ts.map