#!/bin/bash

# Compile Circom Circuits for Production
# This script compiles the zero-knowledge circuits for membership proofs and amount commitments

set -e

echo "🔧 Compiling TrustNet ZK Circuits"
echo "==================================="
echo ""

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ circom not found. Installing..."
    echo ""
    echo "Please install circom from: https://docs.circom.io/getting-started/installation/"
    echo "Quick install:"
    echo "  git clone https://github.com/iden3/circom.git"
    echo "  cd circom"
    echo "  cargo build --release"
    echo "  cargo install --path circom"
    exit 1
fi

echo "✅ circom detected: $(circom --version)"
echo ""

# Navigate to circuits directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create build directories
mkdir -p build/transaction_membership
mkdir -p build/amount_commitment

# Compile transaction_membership circuit
echo "📦 Compiling transaction_membership.circom..."
circom transaction_membership.circom \
  --r1cs \
  --wasm \
  --sym \
  --c \
  --output build/transaction_membership

if [ $? -eq 0 ]; then
    echo "✅ transaction_membership circuit compiled"
else
    echo "❌ Failed to compile transaction_membership circuit"
    exit 1
fi

echo ""

# Compile amount_commitment circuit
echo "📦 Compiling amount_commitment.circom..."
circom amount_commitment.circom \
  --r1cs \
  --wasm \
  --sym \
  --c \
  --output build/amount_commitment

if [ $? -eq 0 ]; then
    echo "✅ amount_commitment circuit compiled"
else
    echo "❌ Failed to compile amount_commitment circuit"
    exit 1
fi

echo ""
echo "✅ All circuits compiled successfully!"
echo ""
echo "📊 Circuit Stats:"
echo "----------------"

# Show circuit stats
if command -v snarkjs &> /dev/null; then
    echo "Transaction Membership Circuit:"
    snarkjs r1cs info build/transaction_membership/transaction_membership.r1cs
    echo ""
    echo "Amount Commitment Circuit:"
    snarkjs r1cs info build/amount_commitment/amount_commitment.r1cs
fi

echo ""
echo "Next step: Run ./setup-keys.sh to generate proving and verification keys"
