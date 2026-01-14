#!/bin/bash
set -e

# Packaging script for Causality Framework
# Generates .tgz files for all packages in release/ folder

echo "📦 Packaging Causality Framework for External Use..."

mkdir -p release
cd release
rm -f *.tgz
cd ..

PACKAGES=(
    "packages/sdk-core"
    "packages/collector-core"
    "packages/storage-core"
    "packages/metrics-core"
    "packages/behavior-core"
    "packages/impact-core"
    "packages/code-tracing-core"
    "packages/historical-core"
    "packages/ai-core"
    "packages/predictive-core"
)

for pkg in "${PACKAGES[@]}"; do
    echo "🔹 Packing $(basename $pkg)..."
    cd $pkg
    npm pack --pack-destination ../../release
    cd ../..
done

echo "✅ All packages packed in 'release/' folder."
echo "   You can now copy these files to your external project and install them."
