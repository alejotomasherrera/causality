/**
 * @causality/sdk-core — Event Emitter
 *
 * Simple, best-effort event emitter for action events.
 *
 * Design rules:
 * - Listeners are wrapped in try/catch — a failing listener never breaks the SDK
 * - Emission is synchronous but non-blocking
 * - Multiple listeners are supported
 */

import type { ActionEvent, ActionEventListener } from './types.js';

/**
 * Internal set of registered listeners.
 */
const listeners: Set<ActionEventListener> = new Set();

/**
 * Subscribe to action events.
 *
 * @param listener - Callback invoked for each action event
 * @returns Unsubscribe function
 *
 * @example
 * const unsubscribe = onActionEvent((event) => {
 *   console.log(JSON.stringify(event));
 * });
 *
 * // Later: stop receiving events
 * unsubscribe();
 */
export function onActionEvent(listener: ActionEventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Emit an action event to all registered listeners.
 *
 * Best-effort: if a listener throws, the error is caught and logged,
 * but other listeners continue to receive the event.
 *
 * @internal
 */
export function emitActionEvent(event: ActionEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      // Best-effort: log but don't break
      console.error('[causality] Listener error:', error);
    }
  }
}

/**
 * Clear all listeners. Useful for testing.
 * @internal
 */
export function clearActionEventListeners(): void {
  listeners.clear();
}
