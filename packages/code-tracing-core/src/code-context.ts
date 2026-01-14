/**
 * @causality/code-tracing-core — Code Context
 *
 * Map actions to their source code locations.
 * Deterministic mapping based on action name patterns.
 */

import type { CodeContext, CausalStep } from './types.js';

/**
 * Code mapping registry.
 */
export class CodeMappingRegistry {
  private readonly mappings: Map<string, CodeContext> = new Map();
  private readonly patterns: Array<{ pattern: RegExp; context: Partial<CodeContext> }> = [];

  /**
   * Register a direct mapping.
   */
  register(actionName: string, context: Omit<CodeContext, 'actionName'>): void {
    this.mappings.set(actionName, { ...context, actionName });
  }

  /**
   * Register a pattern-based mapping.
   */
  registerPattern(pattern: RegExp, context: Partial<Omit<CodeContext, 'actionName'>>): void {
    this.patterns.push({ pattern, context });
  }

  /**
   * Get code context for an action.
   */
  get(actionName: string): CodeContext | undefined {
    // Direct mapping first
    const direct = this.mappings.get(actionName);
    if (direct) return direct;

    // Pattern matching
    for (const { pattern, context } of this.patterns) {
      if (pattern.test(actionName)) {
        return {
          file: context.file ?? inferFileFromAction(actionName),
          function: context.function ?? actionName,
          module: context.module,
          lines: context.lines,
          actionName,
        };
      }
    }

    // Infer from action name
    return inferCodeContext(actionName);
  }

  /**
   * Get all registered mappings.
   */
  getAllMappings(): Map<string, CodeContext> {
    return new Map(this.mappings);
  }

  /**
   * Import mappings.
   */
  import(mappings: Map<string, CodeContext> | Array<[string, CodeContext]>): void {
    const entries = mappings instanceof Map ? mappings.entries() : mappings;
    for (const [name, context] of entries) {
      this.mappings.set(name, context);
    }
  }

  /**
   * Clear all mappings.
   */
  clear(): void {
    this.mappings.clear();
    this.patterns.length = 0;
  }
}

/**
 * Infer code context from action name.
 */
export function inferCodeContext(actionName: string): CodeContext {
  const file = inferFileFromAction(actionName);
  const func = inferFunctionFromAction(actionName);
  const module = inferModuleFromAction(actionName);

  return {
    file,
    function: func,
    module,
    actionName,
  };
}

/**
 * Infer file path from action name.
 */
export function inferFileFromAction(actionName: string): string {
  // Common patterns:
  // "ProcessPayment" → "src/payment/processor.ts"
  // "FetchUserData" → "src/user/fetcher.ts"
  // "RenderDashboard" → "src/components/dashboard.tsx"

  const normalized = actionName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');

  const parts = normalized.split('-');

  // Determine file extension
  const extension = inferExtension(actionName);

  // Determine directory
  const dir = inferDirectory(parts);

  // Determine filename
  const filename = parts.slice(-1)[0] || 'index';

  return `src/${dir}/${filename}.${extension}`;
}

/**
 * Infer function name from action name.
 */
export function inferFunctionFromAction(actionName: string): string {
  // Convert to camelCase
  return actionName.charAt(0).toLowerCase() + actionName.slice(1);
}

/**
 * Infer module from action name.
 */
export function inferModuleFromAction(actionName: string): string | undefined {
  const patterns: Array<{ test: RegExp; module: string }> = [
    { test: /^Fetch|^Get|^Load/, module: 'data' },
    { test: /^Render|^Display|^Show/, module: 'ui' },
    { test: /^Process|^Handle|^Execute/, module: 'handlers' },
    { test: /^Validate|^Check|^Verify/, module: 'validation' },
    { test: /^Save|^Create|^Update|^Delete/, module: 'persistence' },
    { test: /^Auth|^Login|^Logout/, module: 'auth' },
    { test: /^Send|^Notify|^Email/, module: 'notifications' },
    { test: /^Connect|^Disconnect/, module: 'connections' },
  ];

  for (const { test, module } of patterns) {
    if (test.test(actionName)) {
      return module;
    }
  }

  return undefined;
}

/**
 * Infer file extension from action name.
 */
function inferExtension(actionName: string): string {
  if (/^Render|^Display|^Show/.test(actionName)) {
    return 'tsx';
  }
  return 'ts';
}

/**
 * Infer directory from action parts.
 */
function inferDirectory(parts: string[]): string {
  // Use first part as directory, or 'core' if only one part
  if (parts.length <= 1) {
    return 'core';
  }

  // Common directory mappings
  const dirMappings: Record<string, string> = {
    fetch: 'data',
    get: 'data',
    load: 'data',
    render: 'components',
    display: 'components',
    show: 'components',
    process: 'handlers',
    handle: 'handlers',
    execute: 'handlers',
    validate: 'validation',
    check: 'validation',
    save: 'persistence',
    create: 'persistence',
    update: 'persistence',
    delete: 'persistence',
    auth: 'auth',
    login: 'auth',
    logout: 'auth',
    send: 'notifications',
    notify: 'notifications',
  };

  const firstPart = parts[0];
  return dirMappings[firstPart] || firstPart;
}

/**
 * Extract code contexts from causal steps.
 */
export function extractCodeContexts(
  steps: CausalStep[],
  registry?: CodeMappingRegistry
): Map<string, CodeContext> {
  const contexts = new Map<string, CodeContext>();

  for (const step of steps) {
    const context = registry?.get(step.name) ?? inferCodeContext(step.name);
    contexts.set(step.name, context);
  }

  return contexts;
}

/**
 * Create a code mapping registry.
 */
export function createCodeMappingRegistry(): CodeMappingRegistry {
  return new CodeMappingRegistry();
}
