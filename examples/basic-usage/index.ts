/**
 * @causality/sdk-core — Basic Usage Example
 *
 * This example demonstrates how to use the Causality SDK to capture
 * causal execution of an order processing flow.
 *
 * Run with: npx ts-node index.ts
 */

import {
  runAction,
  startAction,
  getCurrentAction,
  onActionEvent,
} from '@causality/sdk-core';

// Subscribe to events and log them as JSON
const unsubscribe = onActionEvent((event) => {
  console.log(JSON.stringify(event));
});

// Simulated business logic
async function validateUser(userId: string): Promise<{ id: string; name: string }> {
  // Simulate async validation
  await new Promise((resolve) => setTimeout(resolve, 10));
  return { id: userId, name: 'John Doe' };
}

async function processPayment(amount: number): Promise<{ transactionId: string }> {
  await new Promise((resolve) => setTimeout(resolve, 20));
  
  // Access current action context
  const ctx = getCurrentAction();
  console.error(`[DEBUG] Processing payment in trace: ${ctx?.traceId}`);
  
  return { transactionId: `txn-${Date.now()}` };
}

async function createOrder(userId: string, amount: number): Promise<{ orderId: string }> {
  await new Promise((resolve) => setTimeout(resolve, 5));
  return { orderId: `order-${Date.now()}` };
}

// Main flow using runAction (recommended)
async function handleOrderWithRunAction() {
  console.error('\n=== Using runAction ===\n');

  const result = await runAction(
    { name: 'CreateOrder', attributes: { source: 'web' } },
    async () => {
      // Nested action: ValidateUser
      const user = await runAction('ValidateUser', async () => {
        return validateUser('user-123');
      });

      // Nested action: ProcessPayment
      const payment = await runAction(
        { name: 'ProcessPayment', attributes: { amount: 99.99 } },
        async () => {
          return processPayment(99.99);
        }
      );

      // Create the order
      const order = await createOrder(user.id, 99.99);

      return {
        order,
        user,
        payment,
      };
    }
  );

  console.error('\n[RESULT]', result);
}

// Alternative flow using startAction (manual control)
async function handleOrderWithStartAction() {
  console.error('\n=== Using startAction ===\n');

  const action = startAction({ name: 'ManualOrder', attributes: { source: 'api' } });

  try {
    await new Promise((resolve) => setTimeout(resolve, 15));
    action.setAttribute('customerId', 'cust-456');
    action.setAttribute('items', 3);
    action.end();
  } catch (error) {
    action.end(error);
    throw error;
  }
}

// Example with error handling
async function handleFailingOrder() {
  console.error('\n=== Error Handling Example ===\n');

  try {
    await runAction('FailingOrder', async () => {
      await runAction('Setup', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
      });

      // This will fail
      await runAction('RiskyOperation', async () => {
        throw new Error('Payment gateway unavailable');
      });
    });
  } catch (error) {
    console.error('[CAUGHT ERROR]', (error as Error).message);
  }
}

// Run all examples
async function main() {
  await handleOrderWithRunAction();
  await handleOrderWithStartAction();
  await handleFailingOrder();

  // Cleanup
  unsubscribe();

  console.error('\n=== Done ===\n');
}

main().catch(console.error);
