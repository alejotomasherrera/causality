/**
 * @causality/behavior-core — Behavior Analyzer
 *
 * Main orchestrator for behavioral consistency analysis.
 * Produces deterministic, structured output for Impact Core integration.
 */

import type {
  ActionMetrics,
  MetricFinding,
  ExecutionHistory,
  SourceContext,
  ActionContext,
  BehaviorAnomaly,
  BehaviorAnalysisResult,
  BehaviorAnalysisConfig,
  AnalysisInput,
  DEFAULT_BEHAVIOR_CONFIG,
} from './types.js';
import { ExecutionHistoryStore, createHistoryStore } from './history.js';
import { detectAnomaly, isAnomalous } from './detector.js';
import {
  OccurrenceTracker,
  createOccurrenceTracker,
  shouldFlagForReview,
} from './sensitivity.js';

/**
 * Behavior Analyzer orchestrates the full analysis pipeline.
 */
export class BehaviorAnalyzer {
  private readonly config: Required<BehaviorAnalysisConfig>;
  private readonly historyStore: ExecutionHistoryStore;
  private readonly occurrenceTracker: OccurrenceTracker;

  constructor(config?: BehaviorAnalysisConfig) {
    this.config = {
      minSamplesForBaseline: config?.minSamplesForBaseline ?? 10,
      stdDevThreshold: config?.stdDevThreshold ?? 2.0,
      minOccurrencesToFlag: config?.minOccurrencesToFlag ?? 3,
      confidenceThreshold: config?.confidenceThreshold ?? 0.7,
    };
    this.historyStore = createHistoryStore();
    this.occurrenceTracker = createOccurrenceTracker();
  }

  /**
   * Record an execution to build history.
   */
  recordExecution(metrics: ActionMetrics): void {
    this.historyStore.record(metrics);
  }

  /**
   * Analyze an action for behavioral anomalies.
   */
  analyze(input: AnalysisInput): BehaviorAnalysisResult | null {
    const { context, metrics, history, source, findings } = input;

    // Check if we have enough history
    if (history.sampleCount < this.config.minSamplesForBaseline) {
      return null;
    }

    // Get occurrence count
    const occurrenceCount = this.occurrenceTracker.getRecentCount(context.actionName);

    // Detect anomaly
    const anomaly = detectAnomaly(
      metrics,
      history,
      source,
      occurrenceCount,
      this.config
    );

    // If anomaly detected, record occurrence
    if (anomaly.observedAnomaly) {
      this.occurrenceTracker.record(context.actionName);
    }

    // Determine if should flag
    const shouldFlag = shouldFlagForReview(
      anomaly.repeatSensitivity,
      anomaly.observedAnomaly
    );

    // Generate deterministic ID
    const id = `behavior-${context.traceId.slice(0, 8)}-${context.actionName.slice(0, 8)}`;

    return {
      id,
      traceId: context.traceId,
      analyzedAt: Date.now(),
      context,
      source,
      anomaly,
      occurrenceCount: occurrenceCount + (anomaly.observedAnomaly ? 1 : 0),
      shouldFlag,
      relatedFindings: findings ?? [],
    };
  }

  /**
   * Analyze using stored history.
   */
  analyzeWithStoredHistory(
    context: ActionContext,
    metrics: ActionMetrics,
    source: SourceContext,
    findings?: MetricFinding[]
  ): BehaviorAnalysisResult | null {
    const history = this.historyStore.get(context.actionName);
    if (!history) {
      return null;
    }

    return this.analyze({
      context,
      metrics,
      history,
      source,
      findings,
    });
  }

  /**
   * Quick check if an action is behaving anomalously.
   */
  isAnomalous(metrics: ActionMetrics): boolean {
    const history = this.historyStore.get(metrics.name);
    if (!history || history.sampleCount < this.config.minSamplesForBaseline) {
      return false;
    }

    return isAnomalous(metrics, history, this.config.stdDevThreshold);
  }

  /**
   * Get history for an action.
   */
  getHistory(actionName: string): ExecutionHistory | undefined {
    return this.historyStore.get(actionName);
  }

  /**
   * Check if analysis is possible for an action.
   */
  canAnalyze(actionName: string): boolean {
    return this.historyStore.hasReliableHistory(
      actionName,
      this.config.minSamplesForBaseline
    );
  }

  /**
   * Get all actions with sufficient history.
   */
  getAnalyzableActions(): string[] {
    return this.historyStore
      .getActionNames()
      .filter((name) => this.canAnalyze(name));
  }

  /**
   * Get occurrence count for an action.
   */
  getOccurrenceCount(actionName: string): number {
    return this.occurrenceTracker.getRecentCount(actionName);
  }

  /**
   * Reset occurrence counts (e.g., after addressing issues).
   */
  resetOccurrences(actionName?: string): void {
    if (actionName) {
      this.occurrenceTracker.reset(actionName);
    } else {
      this.occurrenceTracker.resetAll();
    }
  }

  /**
   * Export current state for persistence.
   */
  export(): { histories: ExecutionHistory[] } {
    return {
      histories: this.historyStore.export(),
    };
  }

  /**
   * Import state from persistence.
   */
  import(state: { histories: ExecutionHistory[] }): void {
    this.historyStore.import(state.histories);
  }
}

/**
 * Analyze a single input without maintaining state.
 */
export function analyzeBehavior(
  input: AnalysisInput,
  config?: BehaviorAnalysisConfig
): BehaviorAnalysisResult | null {
  const cfg: Required<BehaviorAnalysisConfig> = {
    minSamplesForBaseline: config?.minSamplesForBaseline ?? 10,
    stdDevThreshold: config?.stdDevThreshold ?? 2.0,
    minOccurrencesToFlag: config?.minOccurrencesToFlag ?? 3,
    confidenceThreshold: config?.confidenceThreshold ?? 0.7,
  };

  const { context, metrics, history, source, findings } = input;

  // Check if we have enough history
  if (history.sampleCount < cfg.minSamplesForBaseline) {
    return null;
  }

  // Detect anomaly (assume occurrence count 1 for stateless analysis)
  const anomaly = detectAnomaly(metrics, history, source, 1, cfg);

  // For stateless analysis, use singleOccurrence sensitivity
  const shouldFlag = false; // Can't flag without occurrence tracking

  const id = `behavior-${context.traceId.slice(0, 8)}-${context.actionName.slice(0, 8)}`;

  return {
    id,
    traceId: context.traceId,
    analyzedAt: Date.now(),
    context,
    source,
    anomaly,
    occurrenceCount: 1,
    shouldFlag,
    relatedFindings: findings ?? [],
  };
}

/**
 * Convert BehaviorAnalysisResult to JSON for Impact Core.
 */
export function toImpactJson(result: BehaviorAnalysisResult): string {
  return JSON.stringify(result.anomaly, null, 2);
}

/**
 * Create a behavior analyzer.
 */
export function createBehaviorAnalyzer(
  config?: BehaviorAnalysisConfig
): BehaviorAnalyzer {
  return new BehaviorAnalyzer(config);
}
