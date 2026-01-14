# How to integrate Causality SDK into an External Project

This guide explains how to install the Causality SDK into your existing Node.js project.

## Option 1: Install from Local Tarballs (Recommended)

This method ensures you are using the exact built versions without symbolic link issues.

### 1. Build and Pack

Run the provided script to generate `.tgz` files for all packages:

```bash
# In the causality root directory
./scripts/build-all.sh
./scripts/pack-all.sh
```

This will create a `release/` folder containing files like `causality-sdk-core-0.1.0.tgz`.

### 2. Copy to Your Project

Create a `lib` or `vendor` folder in your project and copy the `.tgz` files there:

```bash
# In your project
mkdir -p lib
cp /path/to/causality/release/*.tgz lib/
```

### 3. Install dependencies

Install the packages pointing to the local files. You must install them in dependency order:

```bash
npm install ./lib/causality-sdk-core-*.tgz
npm install ./lib/causality-collector-core-*.tgz
npm install ./lib/causality-storage-core-*.tgz
npm install ./lib/causality-metrics-core-*.tgz
npm install ./lib/causality-behavior-core-*.tgz
npm install ./lib/causality-impact-core-*.tgz
npm install ./lib/causality-code-tracing-core-*.tgz
npm install ./lib/causality-historical-core-*.tgz
npm install ./lib/causality-ai-core-*.tgz
npm install ./lib/causality-predictive-core-*.tgz
```

## Option 2: NPM Link (Dev Mode)

If you want to modify the SDK and see changes live in your project:

1. **Link in SDK:**

   ```bash
   cd packages/sdk-core
   npm link
   # Repeat for all packages
   ```

2. **Link in Your Project:**
   ```bash
   npm link @causality/sdk-core @causality/collector-core ...
   ```

> **Note:** `npm link` can sometimes cause issues with peer dependencies or duplicate type definitions. Option 1 is safer for testing.

## Example Usage

Once installed, you can import and use the SDK as shown in `examples/full-flow-integration`:

```typescript
import { runAction, onActionEvent } from "@causality/sdk-core";
// ... other imports

// Your code
await runAction("MyAction", async () => {
  // ...
});
```
