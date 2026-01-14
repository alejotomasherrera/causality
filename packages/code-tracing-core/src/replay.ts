/**
 * @causality/code-tracing-core — Replay Instructions
 *
 * Generate step-by-step instructions to reproduce issues.
 */

import type {
  ReproducibilityExplanation,
  PropagationStep,
  EnrichedReplayInstruction,
} from './types.js';

/**
 * Generate replay instructions from explanation and propagation.
 */
export function generateReplayInstructions(
  explanation: ReproducibilityExplanation,
  propagation: PropagationStep[],
  inputs: Record<string, unknown>
): EnrichedReplayInstruction[] {
  const instructions: EnrichedReplayInstruction[] = [];
  let step = 1;

  // Setup phase: prepare inputs
  instructions.push({
    step: step++,
    type: 'setup',
    action: 'Prepare inputs',
    description: 'Set up required inputs for reproduction',
    inputs: { ...inputs },
  });

  // Setup phase: configure load if needed
  if (explanation.conditions.loadCharacteristics.maxConcurrentActions > 1) {
    instructions.push({
      step: step++,
      type: 'setup',
      action: 'Configure concurrency',
      description: `Prepare ${explanation.conditions.loadCharacteristics.maxConcurrentActions} concurrent requests`,
      inputs: {
        concurrency: explanation.conditions.loadCharacteristics.maxConcurrentActions,
        requestsPerSecond: explanation.conditions.loadCharacteristics.actionsPerSecond,
      },
    });
  }

  // Setup phase: resource pressure if needed
  const { resourcePressure } = explanation.conditions;
  if (resourcePressure.cpuPressure || resourcePressure.memoryPressure) {
    instructions.push({
      step: step++,
      type: 'setup',
      action: 'Apply resource pressure',
      description: 'Simulate resource constraints',
      inputs: {
        cpuPressure: resourcePressure.cpuPressure,
        memoryPressure: resourcePressure.memoryPressure,
        peakCpuDelta: resourcePressure.peakCpuDelta,
        peakMemoryDeltaMb: resourcePressure.peakMemoryDeltaMb,
      },
    });
  }

  // Action phases: follow propagation chain
  for (const prop of propagation) {
    instructions.push({
      step: step++,
      type: 'action',
      action: prop.actionName,
      description: generateActionDescription(prop),
      service: prop.service.name,
      endpoint: prop.service.endpoint,
    });
  }

  // Verify phase: check for issue
  instructions.push({
    step: step++,
    type: 'verify',
    action: 'Verify issue',
    description: generateVerifyDescription(explanation),
  });

  // Cleanup phase if needed
  if (hasCleanupNeeded(propagation)) {
    instructions.push({
      step: step++,
      type: 'cleanup',
      action: 'Clean up',
      description: 'Restore system state after reproduction',
    });
  }

  return instructions;
}

/**
 * Generate action description.
 */
function generateActionDescription(prop: PropagationStep): string {
  const parts: string[] = [];

  // Service context
  parts.push(`Execute "${prop.actionName}" on ${prop.service.type}`);

  // Cross-service indicator
  if (prop.isCrossService) {
    parts.push(`(cross-service call to ${prop.service.name})`);
  }

  // Code context
  parts.push(`in ${prop.code.file}::${prop.code.function}`);

  return parts.join(' ');
}

/**
 * Generate verify description.
 */
function generateVerifyDescription(explanation: ReproducibilityExplanation): string {
  switch (explanation.issueType) {
    case 'explicit_error':
      return `Check for error in "${explanation.failurePoint?.name ?? 'action'}": ${explanation.summary}`;
    case 'silent_degradation':
      return `Verify silent degradation: response appears normal but performance degraded`;
    case 'degradation':
      return `Check for degradation: latency or resource usage above threshold`;
    default:
      return `Verify the issue described: ${explanation.summary}`;
  }
}

/**
 * Check if cleanup is needed.
 */
function hasCleanupNeeded(propagation: PropagationStep[]): boolean {
  // Cleanup needed if any write operations to DB
  return propagation.some(
    (p) => p.service.type === 'db' && p.service.operation !== 'read'
  );
}

/**
 * Format instructions as markdown.
 */
export function formatInstructionsAsMarkdown(
  instructions: EnrichedReplayInstruction[]
): string {
  const lines: string[] = ['## Reproduction Steps\n'];

  for (const inst of instructions) {
    const icon = getStepIcon(inst.type);
    lines.push(`### ${icon} Step ${inst.step}: ${inst.action}\n`);
    lines.push(inst.description);
    lines.push('');

    if (inst.inputs && Object.keys(inst.inputs).length > 0) {
      lines.push('**Inputs:**');
      lines.push('```json');
      lines.push(JSON.stringify(inst.inputs, null, 2));
      lines.push('```');
      lines.push('');
    }

    if (inst.service) {
      lines.push(`**Service:** ${inst.service}`);
      if (inst.endpoint) {
        lines.push(`**Endpoint:** ${inst.endpoint}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Get step icon.
 */
function getStepIcon(type: EnrichedReplayInstruction['type']): string {
  switch (type) {
    case 'setup':
      return '🔧';
    case 'action':
      return '▶️';
    case 'verify':
      return '✅';
    case 'cleanup':
      return '🧹';
    default:
      return '📝';
  }
}
