#!/bin/bash
# Deploy Perfex Health to Cloudflare Pages
# This script builds and deploys the health variant

set -e

echo "======================================"
echo "   Deploying Perfex Health"
echo "======================================"

# Navigate to web app directory
cd "$(dirname "$0")/../apps/web"

# Set environment variables for health variant
export VITE_APP_VARIANT=perfex-health
export VITE_APP_NAME="Perfex Health"
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
npx wrangler pages deploy dist --project-name=perfex-health --branch=main

echo ""
echo "======================================"
echo "   Deployment Complete!"
echo "======================================"
echo ""
echo "Perfex Health is now live at:"
echo "  https://perfex-health.pages.dev"
echo ""
