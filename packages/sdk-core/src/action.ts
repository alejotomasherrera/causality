/**
 * @causality/sdk-core — Action Implementation
 *
 * Core implementation of the Action model.
 *
 * Architecture:
 * - ActionState: internal mutable state (never exposed)
 * - ActionSnapshot: immutable snapshot for emission
 * - ActionHandle: public interface for manual control
 */

import { randomUUID } from 'crypto';
import type {
  ActionSnapshot,
  ActionHandle,
  ActionOptions,
  ActionStatus,
  ActionError,
} from './types.js';
import { emitActionEvent } from './emitter.js';
import {
  runWithContext,
  resolveTraceId,
  getParentActionId,
  getActionContext,
} from './context.js';

/**
 * Parse action input into ActionOptions.
 * Supports both string and object forms for extensibility.
 */
function parseOptions(input: string | ActionOptions): ActionOptions {
  if (typeof input === 'string') {
    return { name: input };
  }
  return input;
}

/**
 * Internal mutable state of an action.
 * This is NEVER exposed or emitted directly.
 */
interface ActionState {
  id: string;
  name: string;
  traceId: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  status: ActionStatus;
  attributes: Record<string, unknown>;
  error?: ActionError;
}

/**
 * Create an immutable snapshot from mutable state.
 * This is what gets emitted in events.
 */
function createSnapshot(state: ActionState): ActionSnapshot {
  return {
    id: state.id,
    name: state.name,
    traceId: state.traceId,
    startTime: state.startTime,
    status: state.status,
    // Include optional fields - undefined values are omitted in JSON.stringify
    ...(state.parentId !== undefined && { parentId: state.parentId }),
    ...(state.endTime !== undefined && { endTime: state.endTime }),
    ...(Object.keys(state.attributes).length > 0 && { 
      attributes: { ...state.attributes } 
    }),
    ...(state.error !== undefined && { 
      error: { ...state.error } 
    }),
  };
}

/**
 * Create a new action state.
 */
function createActionState(options: ActionOptions): ActionState {
  const id = randomUUID();
  const traceId = resolveTraceId(randomUUID);
  const parentId = getParentActionId();

  return {
    id,
    name: options.name,
    traceId,
    parentId,
    startTime: Date.now(),
    status: 'running',
    attributes: options.attributes ? { ...options.attributes } : {},
  };
}

/**
 * End an action with optional error.
 */
function endAction(state: ActionState, error?: unknown): void {
  if (state.status !== 'running') {
    // Already ended, ignore
    return;
  }

  state.endTime = Date.now();

  if (error) {
    state.status = 'error';
    state.error = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
  } else {
    state.status = 'ok';
  }

  // Emit immutable snapshot — status is guaranteed to be 'ok' or 'error'
  emitActionEvent({
    type: 'action.end',
    action: createSnapshot(state),
  });
}

/**
 * Create an ActionHandle from internal state.
 */
function createHandle(state: ActionState): ActionHandle {
  return {
    get id() {
      return state.id;
    },
    get traceId() {
      return state.traceId;
    },
    setAttribute(key: string, value: unknown): void {
      state.attributes[key] = value;
    },
    end(error?: unknown): void {
      endAction(state, error);
    },
  };
}

/**
 * Start a new action manually.
 *
 * Use this when you need fine-grained control over the action lifecycle.
 * Remember to call end() in a finally block.
 *
 * @param input - Action name or options
 * @returns Handle to control the action
 *
 * @example
 * const action = startAction('ProcessPayment');
 * try {
 *   // your logic
 *   action.setAttribute('amount', 100);
 *   action.end();
 * } catch (err) {
 *   action.end(err);
 * }
 */
export function startAction(input: string | ActionOptions): ActionHandle {
  const options = parseOptions(input);
  const state = createActionState(options);

  // Emit start event with immutable snapshot
  emitActionEvent({
    type: 'action.start',
    action: createSnapshot(state),
  });

  return createHandle(state);
}

/**
 * Run a function within an action context.
 *
 * This is the recommended way to create actions. It automatically:
 * - Creates the action
 * - Propagates context for nested actions
 * - Ends the action on completion or error
 *
 * @param input - Action name or options
 * @param fn - Async function to execute
 * @returns The result of the function
 *
 * @example
 * const order = await runAction('CreateOrder', async () => {
 *   const user = await runAction('ValidateUser', async () => {
 *     return validateUser();
 *   });
 *   return createOrder(user);
 * });
 */
export async function runAction<T>(
  input: string | ActionOptions,
  fn: () => T | Promise<T>
): Promise<T> {
  const options = parseOptions(input);
  const state = createActionState(options);

  // Emit start event
  emitActionEvent({
    type: 'action.start',
    action: createSnapshot(state),
  });

  // Create context for nested actions
  const context = {
    traceId: state.traceId,
    actionId: state.id,
  };

  try {
    const result = await runWithContext(context, fn);
    endAction(state);
    return result;
  } catch (error) {
    endAction(state, error);
    throw error;
  }
}

/**
 * Get the current action context.
 *
 * Returns undefined if not inside an action.
 *
 * @returns Current action context or undefined
 *
 * @example
 * const ctx = getCurrentAction();
 * if (ctx) {
 *   console.log(`Current trace: ${ctx.traceId}`);
 * }
 */
export function getCurrentAction(): { traceId: string; actionId: string } | undefined {
  return getActionContext();
}
