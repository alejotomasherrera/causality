#!/bin/bash
set -e

echo "📦 Building all packages..."

# 1. SDK Core (Base)
echo "🔹 Building sdk-core..."
cd packages/sdk-core && npm install && npm run build && cd ../..

# 2. Storage Core (Independent)
echo "🔹 Building storage-core..."
cd packages/storage-core && npm install && npm run build && cd ../..

# 3. Collector Core (Depends on SDK)
echo "🔹 Building collector-core..."
cd packages/collector-core && npm install && npm run build && cd ../..

# 4. Metrics Core
echo "🔹 Building metrics-core..."
cd packages/metrics-core && npm install && npm run build && cd ../..

# 5. Behavior Core
echo "🔹 Building behavior-core..."
cd packages/behavior-core && npm install && npm run build && cd ../..

# 6. Code Tracing Core
echo "🔹 Building code-tracing-core..."
cd packages/code-tracing-core && npm install && npm run build && cd ../..

# 7. Reproducibility Core
echo "🔹 Building reproducibility-core..."
cd packages/reproducibility-core && npm install && npm run build && cd ../..

# 8. Impact Core
echo "🔹 Building impact-core..."
cd packages/impact-core && npm install && npm run build && cd ../..

# 9. Historical Core
echo "🔹 Building historical-core..."
cd packages/historical-core && npm install && npm run build && cd ../..

# 10. AI Core
echo "🔹 Building ai-core..."
cd packages/ai-core && npm install && npm run build && cd ../..

# 11. Predictive Core
echo "🔹 Building predictive-core..."
cd packages/predictive-core && npm install && npm run build && cd ../..

echo "✅ All packages built successfully!"
