/**
 * @causality/historical-core
 *
 * Aggregates historical data to identify trends, persistent issues, and silent degradations.
 *
 * @example
 * import { Aggregator, generateReport } from '@causality/historical-core';
 *
 * const aggregator = new Aggregator();
 *
 * // Process incoming enriched explanations
 * aggregator.process(enrichedTrace1);
 * aggregator.process(enrichedTrace2);
 *
 * // Generate report
 * const report = generateReport(aggregator.getAllStats());
 * console.log(JSON.stringify(report, null, 2));
 */
export * from './types.js';
export * from './aggregator.js';
export * from './trend-analyzer.js';
export * from './reporter.js';
//# sourceMappingURL=index.d.ts.map