/**
 * @causality/sdk-core
 *
 * Core SDK for capturing causal execution of distributed systems.
 *
 * This SDK allows you to:
 * - Declare Actions (semantic units of execution)
 * - Propagate context automatically through async code
 * - Emit structured events for causal reconstruction
 *
 * @example
 * import { runAction, onActionEvent } from '@causality/sdk-core';
 *
 * // Subscribe to events
 * onActionEvent((event) => {
 *   console.log(JSON.stringify(event));
 * });
 *
 * // Create actions
 * await runAction('CreateOrder', async () => {
 *   await runAction('ValidateUser', async () => {
 *     // nested action inherits traceId
 *   });
 * });
 *
 * @packageDocumentation
 */

// Public API
export { runAction, startAction, getCurrentAction } from './action.js';
export { onActionEvent } from './emitter.js';

// Types
export type {
  ActionSnapshot,
  ActionHandle,
  ActionOptions,
  ActionEvent,
  ActionStartEvent,
  ActionEndEvent,
  ActionEventListener,
  ActionStatus,
  ActionFinalStatus,
  ActionError,
  ActionContext,
} from './types.js';
