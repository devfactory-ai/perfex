#!/bin/bash
# Deploy Perfex Bakery to Cloudflare Pages
# This script builds and deploys the bakery variant

set -e

echo "======================================"
echo "   Deploying Perfex Bakery"
echo "======================================"

# Navigate to web app directory
cd "$(dirname "$0")/../apps/web"

# Set environment variables for bakery variant
export VITE_APP_VARIANT=perfex-bakery
export VITE_APP_NAME="Perfex Bakery"
export VITE_API_URL="${VITE_API_URL:-https://perfex-api-staging.yassine-techini.workers.dev}"

echo "Building with variant: $VITE_APP_VARIANT"
echo "API URL: $VITE_API_URL"

# Build the application
echo ""
echo "Step 1: Building application..."
npm run build

# Deploy to Cloudflare Pages
echo ""
echo "Step 2: Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name=perfex-bakery --branch=main

echo ""
echo "======================================"
echo "   Deployment Complete!"
echo "======================================"
echo ""
echo "Perfex Bakery is now live at:"
echo "  https://perfex-bakery.pages.dev"
echo ""
