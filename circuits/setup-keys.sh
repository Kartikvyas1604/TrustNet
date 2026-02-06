#!/bin/bash

# Setup ZK-SNARK Keys for Production
# Generates proving and verification keys for the circuits

set -e

echo "🔐 Setting up ZK-SNARK Keys"
echo "============================"
echo ""

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ snarkjs not found. Installing globally with npm..."
    npm install -g snarkjs@latest
fi

echo "✅ snarkjs detected: $(snarkjs --version)"
echo ""

# Navigate to circuits directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create keys directory
mkdir -p keys/transaction_membership
mkdir -p keys/amount_commitment

# Check if circuits are compiled
if [ ! -f "build/transaction_membership/transaction_membership.r1cs" ]; then
    echo "❌ Circuits not compiled. Run ./compile-circuits.sh first"
    exit 1
fi

# ============================================================================
# Phase 1: Powers of Tau Ceremony (Universal Setup)
# ============================================================================

echo "🌟 Phase 1: Powers of Tau Ceremony"
echo "-----------------------------------"

PTAU_SIZE=12  # 2^12 = 4096 constraints (adjust based on circuit size)
PTAU_FILE="keys/pot${PTAU_SIZE}_0000.ptau"
PTAU_FINAL="keys/pot${PTAU_SIZE}_final.ptau"

if [ ! -f "$PTAU_FINAL" ]; then
    echo "Generating Powers of Tau (this may take a few minutes)..."
    
    # Start ceremony
    snarkjs powersoftau new bn128 $PTAU_SIZE "$PTAU_FILE" -v
    
    # Contribute to ceremony
    snarkjs powersoftau contribute "$PTAU_FILE" keys/pot${PTAU_SIZE}_0001.ptau \
      --name="First contribution" -v -e="random entropy"
    
    # Prepare phase 2
    snarkjs powersoftau prepare phase2 keys/pot${PTAU_SIZE}_0001.ptau "$PTAU_FINAL" -v
    
    echo "✅ Powers of Tau ceremony complete"
else
    echo "✅ Using existing Powers of Tau file"
fi

echo ""

# ============================================================================
# Phase 2: Circuit-Specific Setup (Transaction Membership)
# ============================================================================

echo "🔑 Phase 2a: Transaction Membership Circuit Setup"
echo "--------------------------------------------------"

cd build/transaction_membership

# Generate initial zkey
if [ ! -f "../../keys/transaction_membership/circuit_0000.zkey" ]; then
    echo "Generating initial zkey..."
    snarkjs groth16 setup transaction_membership.r1cs \
      ../../"$PTAU_FINAL" \
      ../../keys/transaction_membership/circuit_0000.zkey
fi

# Contribute to phase 2
if [ ! -f "../../keys/transaction_membership/circuit_final.zkey" ]; then
    echo "Contributing to phase 2..."
    snarkjs zkey contribute \
      ../../keys/transaction_membership/circuit_0000.zkey \
      ../../keys/transaction_membership/circuit_final.zkey \
      --name="1st Contributor" -v -e="random entropy"
fi

# Export verification key
echo "Exporting verification key..."
snarkjs zkey export verificationkey \
  ../../keys/transaction_membership/circuit_final.zkey \
  ../../keys/transaction_membership/verification_key.json

# Generate Solidity verifier
echo "Generating Solidity verifier contract..."
snarkjs zkey export solidityverifier \
  ../../keys/transaction_membership/circuit_final.zkey \
  ../../keys/transaction_membership/TransactionMembershipVerifier.sol

# Rename contract from Groth16Verifier to TransactionMembershipVerifier
sed -i '' 's/contract Groth16Verifier {/contract TransactionMembershipVerifier {/' ../../keys/transaction_membership/TransactionMembershipVerifier.sol

echo "✅ Transaction Membership setup complete"

cd ../..
echo ""

# ============================================================================
# Phase 2: Circuit-Specific Setup (Amount Commitment)
# ============================================================================

echo "🔑 Phase 2b: Amount Commitment Circuit Setup"
echo "---------------------------------------------"

cd build/amount_commitment

# Generate initial zkey
if [ ! -f "../../keys/amount_commitment/circuit_0000.zkey" ]; then
    echo "Generating initial zkey..."
    snarkjs groth16 setup amount_commitment.r1cs \
      ../../"$PTAU_FINAL" \
      ../../keys/amount_commitment/circuit_0000.zkey
fi

# Contribute to phase 2
if [ ! -f "../../keys/amount_commitment/circuit_final.zkey" ]; then
    echo "Contributing to phase 2..."
    snarkjs zkey contribute \
      ../../keys/amount_commitment/circuit_0000.zkey \
      ../../keys/amount_commitment/circuit_final.zkey \
      --name="1st Contributor" -v -e="random entropy"
fi

# Export verification key
echo "Exporting verification key..."
snarkjs zkey export verificationkey \
  ../../keys/amount_commitment/circuit_final.zkey \
  ../../keys/amount_commitment/verification_key.json

# Generate Solidity verifier
echo "Generating Solidity verifier contract..."
snarkjs zkey export solidityverifier \
  ../../keys/amount_commitment/circuit_final.zkey \
  ../../keys/amount_commitment/AmountCommitmentVerifier.sol

# Rename contract from Groth16Verifier to AmountCommitmentVerifier
sed -i '' 's/contract Groth16Verifier {/contract AmountCommitmentVerifier {/' ../../keys/amount_commitment/AmountCommitmentVerifier.sol

echo "✅ Amount Commitment setup complete"

cd ../..
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "✅ All keys generated successfully!"
echo ""
echo "📊 Generated files:"
echo "------------------"
echo "Proving keys:"
echo "  - keys/transaction_membership/circuit_final.zkey"
echo "  - keys/amount_commitment/circuit_final.zkey"
echo ""
echo "Verification keys:"
echo "  - keys/transaction_membership/verification_key.json"
echo "  - keys/amount_commitment/verification_key.json"
echo ""
echo "Solidity verifiers:"
echo "  - keys/transaction_membership/TransactionMembershipVerifier.sol"
echo "  - keys/amount_commitment/AmountCommitmentVerifier.sol"
echo ""
echo "🎯 Next steps:"
echo "1. Copy Solidity verifiers to backend/contracts/ directory"
echo "2. Deploy verifier contracts with: npx hardhat run scripts/deploy-verifiers.ts"
echo "3. Update PrivacyPoolHook.sol to use real verifiers"
echo "4. Backend will now generate REAL ZK proofs!"
