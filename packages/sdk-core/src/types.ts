/**
 * @causality/sdk-core — Type Definitions
 *
 * Core types for the Causality SDK.
 * These types define the contract for Actions and Events.
 */

/**
 * Status of an Action.
 * - 'running' is internal only, never emitted in final events
 * - 'ok' means the action completed successfully
 * - 'error' means the action failed with an error
 */
export type ActionStatus = 'running' | 'ok' | 'error';

/**
 * Final status for emitted events (running is never emitted).
 */
export type ActionFinalStatus = 'ok' | 'error';

/**
 * Error information captured when an action fails.
 */
export interface ActionError {
  readonly message: string;
  readonly stack?: string;
}

/**
 * Options for creating an Action.
 * Designed for extensibility: can accept string or object.
 *
 * @example
 * // Simple usage
 * runAction('CreateOrder', async () => { ... })
 *
 * // Extended usage (future)
 * runAction({ name: 'CreateOrder', attributes: { source: 'web' } }, async () => { ... })
 */
export interface ActionOptions {
  readonly name: string;
  readonly attributes?: Record<string, unknown>;
}

/**
 * Immutable snapshot of an Action for emission.
 * This is what gets emitted in events — never the mutable internal state.
 *
 * Key rules:
 * - traceId is created by the first action, inherited by children
 * - parentId links to the parent action (for nesting)
 * - status in 'action.end' events is always 'ok' or 'error', never 'running'
 */
export interface ActionSnapshot {
  readonly id: string;
  readonly name: string;
  readonly traceId: string;
  readonly parentId?: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly status: ActionStatus;
  readonly attributes?: Record<string, unknown>;
  readonly error?: ActionError;
}

/**
 * Action start event.
 */
export interface ActionStartEvent {
  readonly type: 'action.start';
  readonly action: ActionSnapshot;
}

/**
 * Action end event.
 * Note: action.status is guaranteed to be 'ok' or 'error', never 'running'.
 */
export interface ActionEndEvent {
  readonly type: 'action.end';
  readonly action: ActionSnapshot;
}

/**
 * Union type for all action events.
 */
export type ActionEvent = ActionStartEvent | ActionEndEvent;

/**
 * Callback for action event listeners.
 */
export type ActionEventListener = (event: ActionEvent) => void;

/**
 * Handle returned by startAction for manual action control.
 */
export interface ActionHandle {
  /**
   * The unique ID of this action.
   */
  readonly id: string;

  /**
   * The trace ID this action belongs to.
   */
  readonly traceId: string;

  /**
   * Set a custom attribute on this action.
   */
  setAttribute(key: string, value: unknown): void;

  /**
   * End this action successfully.
   */
  end(): void;

  /**
   * End this action with an error.
   */
  end(error: unknown): void;
}

/**
 * Internal context stored in AsyncLocalStorage.
 */
export interface ActionContext {
  readonly traceId: string;
  readonly actionId: string;
}
