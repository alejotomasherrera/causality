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
import type { ActionHandle, ActionOptions } from './types.js';
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
export declare function startAction(input: string | ActionOptions): ActionHandle;
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
export declare function runAction<T>(input: string | ActionOptions, fn: () => T | Promise<T>): Promise<T>;
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
export declare function getCurrentAction(): {
    traceId: string;
    actionId: string;
} | undefined;
//# sourceMappingURL=action.d.ts.map