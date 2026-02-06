#!/bin/bash

# Deploy Sui Move Contracts to Testnet
# This script deploys all TrustNet contracts to Sui testnet

set -e

echo "🚀 Deploying TrustNet Contracts to Sui Testnet"
echo "=============================================="
echo ""

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI not found. Please install from: https://docs.sui.io/build/install"
    exit 1
fi

echo "✅ Sui CLI detected: $(sui --version)"
echo ""

# Check if we're using testnet
NETWORK=$(sui client active-env)
echo "📡 Active network: $NETWORK"

if [ "$NETWORK" != "testnet" ]; then
    echo "⚠️  Warning: Not on testnet. Switching..."
    sui client switch --env testnet
fi

# Get active address
ACTIVE_ADDRESS=$(sui client active-address)
echo "👤 Deploying from: $ACTIVE_ADDRESS"
echo ""

# Check balance
echo "💰 Checking balance..."
sui client gas
echo ""

# Navigate to contracts directory
cd "$(dirname "$0")/../../contracts"

echo "📦 Building contracts..."
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Deploy contracts
echo "🚀 Publishing contracts to Sui testnet..."
echo ""

PUBLISH_OUTPUT=$(sui client publish --gas-budget 500000000 --json 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    echo "$PUBLISH_OUTPUT"
    exit 1
fi

echo "✅ Contracts published successfully!"
echo ""

# Parse deployment info
PACKAGE_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
ORGANIZATION_REGISTRY=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | contains("OrganizationRegistry")) | .objectId')

echo "📋 Deployment Summary:"
echo "====================="
echo "Package ID: $PACKAGE_ID"
echo "Organization Registry: $ORGANIZATION_REGISTRY"
echo ""

# Save deployment info
TIMESTAMP=$(date +%s)
DEPLOYMENT_FILE="../backend/deployments/sui-testnet-$TIMESTAMP.json"

mkdir -p ../backend/deployments

cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "testnet",
  "packageId": "$PACKAGE_ID",
  "organizationRegistry": "$ORGANIZATION_REGISTRY",
  "deployer": "$ACTIVE_ADDRESS",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "transactionDigest": "$(echo "$PUBLISH_OUTPUT" | jq -r '.digest')"
}
EOF

echo "💾 Deployment info saved to: $DEPLOYMENT_FILE"
echo ""

echo "📝 Update your backend .env with these values:"
echo "SUI_PACKAGE_ID=$PACKAGE_ID"
echo "SUI_ORGANIZATION_REGISTRY=$ORGANIZATION_REGISTRY"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with the contract addresses above"
echo "2. Restart your backend server"
echo "3. Test organization registration"
