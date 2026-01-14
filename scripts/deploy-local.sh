#!/bin/bash
set -e

# Target Directories
FACTURACION_DIR="../carwash-system/facturacion-api"
FRONTEND_DIR="../carwash-system/frontend-lavadero-bricces"

# Source Directory (Causality Release)
RELEASE_DIR="release"

echo "🚀 Deploying Causality SDK to Carwash System..."

# 1. Facturacion API
echo "🔹 Copying to Facturacion API..."
mkdir -p "$FACTURACION_DIR/lib"
cp "$RELEASE_DIR"/*.tgz "$FACTURACION_DIR/lib/"

# 2. Frontend Lavadero
echo "🔹 Copying to Frontend..."
mkdir -p "$FRONTEND_DIR/lib"
cp "$RELEASE_DIR"/*.tgz "$FRONTEND_DIR/lib/"

echo "✅ SDK Packages copied to lib/ folders in both projects."
echo "   Next: Run installation commands."
