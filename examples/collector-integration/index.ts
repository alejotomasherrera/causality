/**
 * Causality — SDK + Collector Integration Example
 *
 * Demonstrates end-to-end flow:
 * SDK actions → Collector → Trace reconstruction
 */

import { runAction, onActionEvent } from '@causality/sdk-core';
import {
  createCollector,
  ConsoleTransport,
  InMemoryTransport,
} from '@causality/collector-core';

// Create transports
const memoryTransport = new InMemoryTransport();
const consoleTransport = new ConsoleTransport({ pretty: true });

// Create collector with both transports
const collector = createCollector({
  flushIntervalMs: 1000,
  traceTimeoutMs: 5000,
  transport: {
    async send(trace) {
      await memoryTransport.send(trace);
      await consoleTransport.send(trace);
    },
  },
});

// Connect SDK to collector
const unsubscribe = onActionEvent((event) => collector.ingest(event));

// Simulated business logic
async function validateUser(userId: string) {
  await new Promise((r) => setTimeout(r, 20));
  return { id: userId, name: 'Jane Doe', valid: true };
}

async function checkInventory(items: string[]) {
  await new Promise((r) => setTimeout(r, 30));
  return { available: true, items };
}

async function processPayment(amount: number) {
  await new Promise((r) => setTimeout(r, 40));
  return { transactionId: `txn-${Date.now()}`, amount };
}

async function sendConfirmation(orderId: string) {
  await new Promise((r) => setTimeout(r, 15));
  return { sent: true, orderId };
}

// Main order flow
async function createOrder(userId: string, items: string[], amount: number) {
  return runAction(
    { name: 'CreateOrder', attributes: { userId, itemCount: items.length } },
    async () => {
      // Parallel: validate user and check inventory
      const [user, inventory] = await Promise.all([
        runAction('ValidateUser', () => validateUser(userId)),
        runAction('CheckInventory', () => checkInventory(items)),
      ]);

      if (!user.valid || !inventory.available) {
        throw new Error('Validation failed');
      }

      // Sequential: process payment
      const payment = await runAction(
        { name: 'ProcessPayment', attributes: { amount } },
        () => processPayment(amount)
      );

      // Create order record
      const orderId = `order-${Date.now()}`;

      // Send confirmation (fire and forget pattern)
      await runAction('SendConfirmation', () => sendConfirmation(orderId));

      return {
        orderId,
        user,
        payment,
        items,
      };
    }
  );
}

// Run example
async function main() {
  console.log('=== Causality SDK + Collector Example ===\n');

  // Successful order
  console.log('Creating order...\n');
  const order = await createOrder('user-123', ['item-a', 'item-b'], 99.99);
  console.log('\nOrder created:', order);

  // Flush and show trace
  console.log('\n--- Flushing traces ---\n');
  await collector.flush();

  // Show stats
  console.log('\n--- Collector Stats ---');
  console.log(collector.stats());

  // Access reconstructed trace
  const traces = memoryTransport.getTraces();
  console.log('\n--- Trace Summary ---');
  for (const trace of traces) {
    console.log(`Trace ${trace.traceId}:`);
    console.log(`  Status: ${trace.status}`);
    console.log(`  Duration: ${trace.durationMs}ms`);
    console.log(`  Actions: ${trace.actionCount}`);
    console.log(`  Max Depth: ${trace.maxDepth}`);
  }

  // Cleanup
  unsubscribe();
  await collector.stop();

  console.log('\n=== Done ===');
}

main().catch(console.error);
