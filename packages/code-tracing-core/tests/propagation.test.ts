/**
 * Tests for Service Propagation
 */

import {
  ServiceMappingRegistry,
  createServiceMappingRegistry,
  inferServiceContext,
  inferServiceType,
  inferServiceName,
  buildPropagationChain,
  getServiceFlow,
  detectCrossServiceCalls,
} from '../src/propagation.js';
import type { CausalStep, CodeContext, ServiceContext } from '../src/types.js';

function createStep(name: string, order: number): CausalStep {
  return {
    order,
    actionId: `act-${order}`,
    name,
    depth: 0,
    startTime: 1000 + order * 100,
    endTime: 1100 + order * 100,
    durationMs: 100,
    status: 'ok',
    findings: [],
    isFailurePoint: false,
    contributesToDegradation: false,
  };
}

describe('ServiceMappingRegistry', () => {
  let registry: ServiceMappingRegistry;

  beforeEach(() => {
    registry = createServiceMappingRegistry();
  });

  it('should register and retrieve mappings', () => {
    registry.register('ProcessPayment', {
      name: 'payment-service',
      type: 'microservice',
      endpoint: '/api/payments',
    });

    const context = registry.get('ProcessPayment');

    expect(context).toBeDefined();
    expect(context?.name).toBe('payment-service');
    expect(context?.type).toBe('microservice');
  });

  it('should match patterns', () => {
    registry.registerPattern(/^Render/, {
      type: 'frontend',
    });

    const context = registry.get('RenderDashboard');

    expect(context?.type).toBe('frontend');
  });
});

describe('inferServiceType', () => {
  it('should infer frontend for Render actions', () => {
    expect(inferServiceType('RenderDashboard')).toBe('frontend');
    expect(inferServiceType('DisplayChart')).toBe('frontend');
  });

  it('should infer gateway for Route actions', () => {
    expect(inferServiceType('RouteRequest')).toBe('gateway');
    expect(inferServiceType('GatewayProxy')).toBe('gateway');
  });

  it('should infer db for Query actions', () => {
    expect(inferServiceType('QueryUsers')).toBe('db');
    expect(inferServiceType('InsertOrder')).toBe('db');
  });

  it('should default to microservice', () => {
    expect(inferServiceType('ProcessPayment')).toBe('microservice');
  });
});

describe('inferServiceName', () => {
  it('should infer payment-service for Payment actions', () => {
    expect(inferServiceName('ProcessPayment')).toBe('payment-service');
  });

  it('should infer user-service for User actions', () => {
    expect(inferServiceName('FetchUserProfile')).toBe('user-service');
  });

  it('should infer web-app for frontend actions', () => {
    expect(inferServiceName('RenderDashboard')).toBe('web-app');
  });
});

describe('buildPropagationChain', () => {
  it('should build chain from causal steps', () => {
    const steps = [
      createStep('RenderDashboard', 0),
      createStep('FetchUserData', 1),
      createStep('QueryUsers', 2),
    ];

    const codeMappings = new Map<string, CodeContext>();
    const serviceMappings = new Map<string, ServiceContext>();

    const chain = buildPropagationChain(steps, codeMappings, serviceMappings);

    expect(chain).toHaveLength(3);
    expect(chain[0].actionName).toBe('RenderDashboard');
    expect(chain[0].service.type).toBe('frontend');
    expect(chain[2].service.type).toBe('db');
  });

  it('should detect cross-service calls', () => {
    const steps = [
      createStep('RenderDashboard', 0),
      createStep('ProcessPayment', 1),
    ];

    const chain = buildPropagationChain(steps, new Map(), new Map());
    const crossService = detectCrossServiceCalls(chain);

    expect(crossService.length).toBeGreaterThan(0);
  });
});

describe('getServiceFlow', () => {
  it('should return ordered unique services', () => {
    const steps = [
      createStep('RenderDashboard', 0),
      createStep('ProcessPayment', 1),
      createStep('QueryOrders', 2),
    ];

    const chain = buildPropagationChain(steps, new Map(), new Map());
    const flow = getServiceFlow(chain);

    expect(flow.length).toBeGreaterThan(1);
    expect(flow[0]).toBe('web-app');
  });
});
