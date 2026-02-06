#!/bin/bash

# Quick deployment test script
# Tests hardhat configuration without actual deployment

echo "🧪 Testing TrustNet Deployment Setup"
echo "====================================="
echo ""

# Check if TS_NODE_PROJECT needs to be set
export TS_NODE_PROJECT=tsconfig.hardhat.json

echo "✓ TypeScript configuration: $TS_NODE_PROJECT"
echo ""

echo "📋 Checking prerequisites..."
echo ""

# Check .env file
if [ ! -f "./backend/.env" ]; then
    echo "❌ backend/.env file not found"
    echo "   Create backend/.env with these variables:"
    echo "   - DEPLOYER_PRIVATE_KEY"
    echo "   - BASE_RPC_URL"
    echo "   - BASESCAN_API_KEY"
    exit 1
else
    echo "✓ backend/.env exists"
fi

# Check for required env vars
source ./backend/.env 2>/dev/null

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "⚠️  DEPLOYER_PRIVATE_KEY not set in .env"
fi

if [ -z "$BASE_RPC_URL" ]; then
    echo "⚠️  BASE_RPC_URL not set in .env"
fi

echo ""
echo "🔍 Testing Hardhat compilation..."
npx hardhat compile

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Hardhat setup is working!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Add DEPLOYER_PRIVATE_KEY to backend/.env"
    echo "2. Add BASE_RPC_URL to backend/.env (get from Alchemy)"
    echo "3. Get testnet funds from Base Sepolia faucet"
    echo "4. Run: TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat run backend/scripts/deploy-verifiers.ts --network baseSepolia"
else
    echo ""
    echo "❌ Hardhat compilation failed"
    exit 1
fi
