/**
 * Tests for Code Context
 */

import {
  CodeMappingRegistry,
  createCodeMappingRegistry,
  inferCodeContext,
  inferFileFromAction,
  inferFunctionFromAction,
  inferModuleFromAction,
} from '../src/code-context.js';

describe('CodeMappingRegistry', () => {
  let registry: CodeMappingRegistry;

  beforeEach(() => {
    registry = createCodeMappingRegistry();
  });

  it('should register and retrieve mappings', () => {
    registry.register('ProcessPayment', {
      file: 'src/payment/processor.ts',
      function: 'processPayment',
    });

    const context = registry.get('ProcessPayment');

    expect(context).toBeDefined();
    expect(context?.file).toBe('src/payment/processor.ts');
    expect(context?.function).toBe('processPayment');
    expect(context?.actionName).toBe('ProcessPayment');
  });

  it('should match patterns', () => {
    registry.registerPattern(/^Process/, {
      module: 'handlers',
    });

    const context = registry.get('ProcessOrder');

    expect(context).toBeDefined();
    expect(context?.module).toBe('handlers');
  });

  it('should infer context for unknown actions', () => {
    const context = registry.get('UnknownAction');

    expect(context).toBeDefined();
    expect(context?.file).toContain('src/');
    expect(context?.function).toBeDefined();
  });
});

describe('inferCodeContext', () => {
  it('should infer context from action name', () => {
    const context = inferCodeContext('ProcessPayment');

    expect(context.actionName).toBe('ProcessPayment');
    expect(context.file).toContain('src/');
    expect(context.function).toBe('processPayment');
  });
});

describe('inferFileFromAction', () => {
  it('should infer handler file', () => {
    const file = inferFileFromAction('ProcessOrder');
    expect(file).toMatch(/src\/.*\.ts$/);
  });

  it('should infer component file for Render actions', () => {
    const file = inferFileFromAction('RenderDashboard');
    expect(file).toMatch(/\.tsx$/);
  });

  it('should handle single-word actions', () => {
    const file = inferFileFromAction('Validate');
    expect(file).toContain('src/');
  });
});

describe('inferFunctionFromAction', () => {
  it('should convert to camelCase', () => {
    expect(inferFunctionFromAction('ProcessPayment')).toBe('processPayment');
    expect(inferFunctionFromAction('RenderDashboard')).toBe('renderDashboard');
  });
});

describe('inferModuleFromAction', () => {
  it('should infer data module for Fetch actions', () => {
    expect(inferModuleFromAction('FetchUserData')).toBe('data');
  });

  it('should infer ui module for Render actions', () => {
    expect(inferModuleFromAction('RenderDashboard')).toBe('ui');
  });

  it('should infer auth module for Auth actions', () => {
    expect(inferModuleFromAction('AuthenticateUser')).toBe('auth');
  });

  it('should return undefined for unknown patterns', () => {
    expect(inferModuleFromAction('DoSomething')).toBeUndefined();
  });
});
