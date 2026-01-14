/**
 * Tests for Sensitivity Classifier
 */

import {
  classifySensitivity,
  shouldFlagForReview,
  describeSensitivity,
  OccurrenceTracker,
  createOccurrenceTracker,
} from '../src/sensitivity.js';

describe('classifySensitivity', () => {
  it('should return singleOccurrence for first occurrence', () => {
    const sensitivity = classifySensitivity(1, 0.8, 3, 0.7);
    expect(sensitivity).toBe('singleOccurrence');
  });

  it('should return singleOccurrence below threshold', () => {
    const sensitivity = classifySensitivity(2, 0.8, 3, 0.7);
    expect(sensitivity).toBe('singleOccurrence');
  });

  it('should return flag for repeated occurrences with high confidence', () => {
    const sensitivity = classifySensitivity(5, 0.8, 3, 0.7);
    expect(sensitivity).toBe('flag');
  });

  it('should return singleOccurrence for low confidence even with many occurrences', () => {
    const sensitivity = classifySensitivity(10, 0.5, 3, 0.7);
    expect(sensitivity).toBe('singleOccurrence');
  });
});

describe('shouldFlagForReview', () => {
  it('should return true for flag sensitivity with anomaly', () => {
    expect(shouldFlagForReview('flag', true)).toBe(true);
  });

  it('should return false for singleOccurrence', () => {
    expect(shouldFlagForReview('singleOccurrence', true)).toBe(false);
  });

  it('should return false if no anomaly', () => {
    expect(shouldFlagForReview('flag', false)).toBe(false);
  });
});

describe('describeSensitivity', () => {
  it('should describe single occurrence', () => {
    const desc = describeSensitivity('singleOccurrence', 1);
    expect(desc).toContain('Single occurrence');
  });

  it('should describe low confidence multiple occurrences', () => {
    const desc = describeSensitivity('singleOccurrence', 5);
    expect(desc).toContain('confidence too low');
  });

  it('should describe flagged for review', () => {
    const desc = describeSensitivity('flag', 5);
    expect(desc).toContain('Flagged for review');
    expect(desc).toContain('5 occurrences');
  });
});

describe('OccurrenceTracker', () => {
  let tracker: OccurrenceTracker;

  beforeEach(() => {
    tracker = createOccurrenceTracker(10000); // 10 second window
  });

  describe('record', () => {
    it('should track occurrences', () => {
      tracker.record('TestAction');
      tracker.record('TestAction');

      expect(tracker.getCount('TestAction')).toBe(2);
    });

    it('should track separate actions', () => {
      tracker.record('ActionA');
      tracker.record('ActionB');
      tracker.record('ActionB');

      expect(tracker.getCount('ActionA')).toBe(1);
      expect(tracker.getCount('ActionB')).toBe(2);
    });
  });

  describe('getRecentCount', () => {
    it('should count only recent occurrences', () => {
      const now = Date.now();

      tracker.record('TestAction', now - 5000); // Within window
      tracker.record('TestAction', now - 15000); // Outside window

      expect(tracker.getRecentCount('TestAction', now)).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset specific action', () => {
      tracker.record('ActionA');
      tracker.record('ActionB');

      tracker.reset('ActionA');

      expect(tracker.getCount('ActionA')).toBe(0);
      expect(tracker.getCount('ActionB')).toBe(1);
    });

    it('should reset all actions', () => {
      tracker.record('ActionA');
      tracker.record('ActionB');

      tracker.resetAll();

      expect(tracker.getCount('ActionA')).toBe(0);
      expect(tracker.getCount('ActionB')).toBe(0);
    });
  });
});
