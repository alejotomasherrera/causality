/**
 * @causality/code-tracing-core — Service Propagation
 *
 * Track how actions propagate across services.
 * Map actions to frontend, gateway, microservices, and database.
 */

import type { ServiceContext, ServiceType, PropagationStep, CausalStep, CodeContext } from './types.js';

/**
 * Service mapping registry.
 */
export class ServiceMappingRegistry {
  private readonly mappings: Map<string, ServiceContext> = new Map();
  private readonly patterns: Array<{ pattern: RegExp; context: Partial<ServiceContext> }> = [];

  /**
   * Register a direct mapping.
   */
  register(actionName: string, context: ServiceContext): void {
    this.mappings.set(actionName, context);
  }

  /**
   * Register a pattern-based mapping.
   */
  registerPattern(pattern: RegExp, context: Partial<ServiceContext>): void {
    this.patterns.push({ pattern, context });
  }

  /**
   * Get service context for an action.
   */
  get(actionName: string): ServiceContext | undefined {
    // Direct mapping first
    const direct = this.mappings.get(actionName);
    if (direct) return direct;

    // Pattern matching
    for (const { pattern, context } of this.patterns) {
      if (pattern.test(actionName)) {
        return {
          name: context.name ?? inferServiceName(actionName),
          type: context.type ?? inferServiceType(actionName),
          endpoint: context.endpoint,
          method: context.method,
          table: context.table,
          operation: context.operation,
        };
      }
    }

    // Infer from action name
    return inferServiceContext(actionName);
  }

  /**
   * Get all registered mappings.
   */
  getAllMappings(): Map<string, ServiceContext> {
    return new Map(this.mappings);
  }

  /**
   * Import mappings.
   */
  import(mappings: Map<string, ServiceContext> | Array<[string, ServiceContext]>): void {
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
 * Infer service context from action name.
 */
export function inferServiceContext(actionName: string): ServiceContext {
  const type = inferServiceType(actionName);
  const name = inferServiceName(actionName);
  const dbInfo = type === 'db' ? inferDatabaseInfo(actionName) : undefined;

  return {
    name,
    type,
    table: dbInfo?.table,
    operation: dbInfo?.operation,
  };
}

/**
 * Infer service type from action name.
 */
export function inferServiceType(actionName: string): ServiceType {
  // Frontend patterns
  if (/^Render|^Display|^Show|^Click|^Navigate|^Input/.test(actionName)) {
    return 'frontend';
  }

  // Gateway patterns
  if (/^Route|^Proxy|^Gateway|^Forward/.test(actionName)) {
    return 'gateway';
  }

  // Database patterns
  if (/^Query|^Insert|^Update|^Delete|^Fetch.*DB|^Save.*DB|^Connect.*DB/.test(actionName)) {
    return 'db';
  }

  // External service patterns
  if (/^External|^Third.*Party|^Webhook|^API.*Call/.test(actionName)) {
    return 'external';
  }

  // Default to microservice
  return 'microservice';
}

/**
 * Infer service name from action name.
 */
export function inferServiceName(actionName: string): string {
  const type = inferServiceType(actionName);

  switch (type) {
    case 'frontend':
      return 'web-app';
    case 'gateway':
      return 'api-gateway';
    case 'db':
      return 'database';
    case 'external':
      return 'external-api';
    default:
      // Extract service name from action
      return extractServiceName(actionName);
  }
}

/**
 * Extract service name from action patterns.
 */
function extractServiceName(actionName: string): string {
  // Common patterns: "ProcessPayment" → "payment-service"
  const patterns: Array<{ test: RegExp; service: string }> = [
    { test: /Payment|Billing|Invoice/, service: 'payment-service' },
    { test: /User|Profile|Account/, service: 'user-service' },
    { test: /Order|Cart|Checkout/, service: 'order-service' },
    { test: /Auth|Login|Session/, service: 'auth-service' },
    { test: /Notification|Email|SMS/, service: 'notification-service' },
    { test: /Search|Filter|Query/, service: 'search-service' },
    { test: /Report|Analytics|Metrics/, service: 'analytics-service' },
    { test: /Inventory|Stock|Product/, service: 'inventory-service' },
  ];

  for (const { test, service } of patterns) {
    if (test.test(actionName)) {
      return service;
    }
  }

  return 'core-service';
}

/**
 * Infer database info from action name.
 */
function inferDatabaseInfo(actionName: string): { table?: string; operation?: 'read' | 'write' | 'delete' | 'update' } | undefined {
  let operation: 'read' | 'write' | 'delete' | 'update' | undefined;

  if (/^Query|^Fetch|^Get|^Load/.test(actionName)) {
    operation = 'read';
  } else if (/^Insert|^Create|^Save/.test(actionName)) {
    operation = 'write';
  } else if (/^Update|^Modify/.test(actionName)) {
    operation = 'update';
  } else if (/^Delete|^Remove/.test(actionName)) {
    operation = 'delete';
  }

  // Try to extract table name
  const tableMatch = actionName.match(/(Users?|Orders?|Products?|Payments?|Sessions?|Accounts?)/i);
  const table = tableMatch ? tableMatch[1].toLowerCase() : undefined;

  return { table, operation };
}

/**
 * Build propagation chain from causal steps.
 */
export function buildPropagationChain(
  steps: CausalStep[],
  codeMappings: Map<string, CodeContext>,
  serviceMappings: Map<string, ServiceContext>,
  serviceRegistry?: ServiceMappingRegistry
): PropagationStep[] {
  const propagation: PropagationStep[] = [];
  let previousService: string | undefined;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    const service = serviceMappings.get(step.name) 
      ?? serviceRegistry?.get(step.name) 
      ?? inferServiceContext(step.name);
    
    const code = codeMappings.get(step.name) ?? {
      file: `src/unknown/${step.name.toLowerCase()}.ts`,
      function: step.name,
      actionName: step.name,
    };

    const isCrossService = previousService !== undefined && previousService !== service.name;

    // Map status from CausalStep to PropagationStep
    const mappedStatus: 'ok' | 'error' | 'timeout' | 'degraded' = 
      step.status === 'incomplete' ? 'timeout' : step.status;

    propagation.push({
      order: i,
      actionName: step.name,
      service,
      code,
      startTime: step.startTime,
      endTime: step.endTime,
      durationMs: step.durationMs,
      status: mappedStatus,
      parentActionName: i > 0 ? steps[i - 1].name : undefined,
      isCrossService,
    });

    previousService = service.name;
  }

  return propagation;
}

/**
 * Detect cross-service calls in the chain.
 */
export function detectCrossServiceCalls(chain: PropagationStep[]): PropagationStep[] {
  return chain.filter((step) => step.isCrossService);
}

/**
 * Group propagation by service.
 */
export function groupByService(chain: PropagationStep[]): Map<string, PropagationStep[]> {
  const groups = new Map<string, PropagationStep[]>();

  for (const step of chain) {
    const serviceName = step.service.name;
    const existing = groups.get(serviceName) ?? [];
    existing.push(step);
    groups.set(serviceName, existing);
  }

  return groups;
}

/**
 * Get service flow (ordered unique services).
 */
export function getServiceFlow(chain: PropagationStep[]): string[] {
  const flow: string[] = [];

  for (const step of chain) {
    if (flow.length === 0 || flow[flow.length - 1] !== step.service.name) {
      flow.push(step.service.name);
    }
  }

  return flow;
}

/**
 * Create a service mapping registry.
 */
export function createServiceMappingRegistry(): ServiceMappingRegistry {
  return new ServiceMappingRegistry();
}
