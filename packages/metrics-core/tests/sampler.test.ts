/**
 * Tests for Resource Sampler
 */

import { ResourceSampler, createSnapshot, calculateDelta } from '../src/sampler.js';

describe('ResourceSampler', () => {
  let sampler: ResourceSampler;

  beforeEach(() => {
    sampler = new ResourceSampler();
  });

  afterEach(() => {
    sampler.destroy();
  });

  describe('sample', () => {
    it('should return a valid MetricSnapshot', () => {
      const snapshot = sampler.sample();

      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(typeof snapshot.cpuUsage).toBe('number');
      expect(typeof snapshot.memoryRssMb).toBe('number');
      expect(typeof snapshot.heapUsedMb).toBe('number');
    });

    it('should have positive memory values', () => {
      const snapshot = sampler.sample();

      expect(snapshot.memoryRssMb).toBeGreaterThan(0);
      expect(snapshot.heapUsedMb).toBeGreaterThan(0);
    });

    it('should have CPU between 0 and 100', () => {
      // First sample is 0
      sampler.sample();

      // Wait a bit and take second sample
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }

      const snapshot = sampler.sample();
      expect(snapshot.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(snapshot.cpuUsage).toBeLessThanOrEqual(100);
    });
  });

  describe('event loop monitoring', () => {
    it('should include eventLoopLagMs when enabled', () => {
      const samplerWithLag = new ResourceSampler({ trackEventLoopLag: true });

      // Give it a moment to collect data
      const snapshot = samplerWithLag.sample();

      expect(snapshot.eventLoopLagMs).toBeDefined();
      expect(typeof snapshot.eventLoopLagMs).toBe('number');

      samplerWithLag.destroy();
    });

    it('should not include eventLoopLagMs when disabled', () => {
      const snapshot = sampler.sample();
      expect(snapshot.eventLoopLagMs).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should reset CPU tracking state', () => {
      sampler.sample();
      sampler.sample();
      sampler.reset();

      // After reset, first sample should return 0 CPU
      const snapshot = sampler.sample();
      expect(snapshot.cpuUsage).toBe(0);
    });
  });
});

describe('createSnapshot', () => {
  it('should create a snapshot with 0 CPU', () => {
    const snapshot = createSnapshot();

    expect(snapshot.cpuUsage).toBe(0);
    expect(snapshot.memoryRssMb).toBeGreaterThan(0);
  });
});

describe('calculateDelta', () => {
  it('should calculate delta between snapshots', () => {
    const start = {
      timestamp: 1000,
      cpuUsage: 10,
      memoryRssMb: 100,
      heapUsedMb: 50,
    };

    const end = {
      timestamp: 1500,
      cpuUsage: 25,
      memoryRssMb: 150,
      heapUsedMb: 75,
    };

    const delta = calculateDelta(start, end);

    expect(delta.durationMs).toBe(500);
    expect(delta.cpuDelta).toBe(15);
    expect(delta.memoryDeltaMb).toBe(50);
    expect(delta.heapDeltaMb).toBe(25);
  });

  it('should handle event loop lag delta', () => {
    const start = {
      timestamp: 1000,
      cpuUsage: 10,
      memoryRssMb: 100,
      heapUsedMb: 50,
      eventLoopLagMs: 5,
    };

    const end = {
      timestamp: 1500,
      cpuUsage: 10,
      memoryRssMb: 100,
      heapUsedMb: 50,
      eventLoopLagMs: 15,
    };

    const delta = calculateDelta(start, end);

    expect(delta.eventLoopLagDeltaMs).toBe(10);
  });

  it('should handle negative deltas', () => {
    const start = {
      timestamp: 1000,
      cpuUsage: 50,
      memoryRssMb: 200,
      heapUsedMb: 100,
    };

    const end = {
      timestamp: 1500,
      cpuUsage: 30,
      memoryRssMb: 150,
      heapUsedMb: 80,
    };

    const delta = calculateDelta(start, end);

    expect(delta.cpuDelta).toBe(-20);
    expect(delta.memoryDeltaMb).toBe(-50);
    expect(delta.heapDeltaMb).toBe(-20);
  });
});
