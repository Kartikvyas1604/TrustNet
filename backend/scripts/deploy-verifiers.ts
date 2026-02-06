import { run } from "hardhat";
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy ZK Proof Verifier Contracts
 * Deploys the generated Solidity verifiers to the specified network
 */

async function main() {
  console.log("🚀 Deploying ZK Proof Verifier Contracts");
  console.log("=========================================\n");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deployer address:", deployer.address);
  console.log("Network:", network.name, `(chainId: ${network.chainId})`);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Check if verifier contracts exist
  const membershipVerifierPath = path.join(__dirname, "../../circuits/keys/transaction_membership/TransactionMembershipVerifier.sol");
  const amountVerifierPath = path.join(__dirname, "../../circuits/keys/amount_commitment/AmountCommitmentVerifier.sol");

  if (!fs.existsSync(membershipVerifierPath)) {
    throw new Error(`Transaction Membership Verifier not found at: ${membershipVerifierPath}\nRun: cd circuits && ./setup-keys.sh`);
  }

  if (!fs.existsSync(amountVerifierPath)) {
    throw new Error(`Amount Commitment Verifier not found at: ${amountVerifierPath}\nRun: cd circuits && ./setup-keys.sh`);
  }

  // Copy verifiers to contracts directory
  const contractsDir = path.join(__dirname, "../contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  console.log("📋 Copying verifier contracts...");
  fs.copyFileSync(membershipVerifierPath, path.join(contractsDir, "TransactionMembershipVerifier.sol"));
  fs.copyFileSync(amountVerifierPath, path.join(contractsDir, "AmountCommitmentVerifier.sol"));
  console.log("✅ Verifier contracts copied to backend/contracts/\n");

  // Deploy Transaction Membership Verifier
  console.log("📦 Deploying Transaction Membership Verifier...");
  const MembershipVerifierFactory = await ethers.getContractFactory("TransactionMembershipVerifier");
  const membershipVerifier = await MembershipVerifierFactory.deploy();
  await membershipVerifier.waitForDeployment();
  const membershipVerifierAddress = await membershipVerifier.getAddress();
  console.log("✅ Transaction Membership Verifier deployed to:", membershipVerifierAddress, "\n");

  // Deploy Amount Commitment Verifier
  console.log("📦 Deploying Amount Commitment Verifier...");
  const AmountVerifierFactory = await ethers.getContractFactory("AmountCommitmentVerifier");
  const amountVerifier = await AmountVerifierFactory.deploy();
  await amountVerifier.waitForDeployment();
  const amountVerifierAddress = await amountVerifier.getAddress();
  console.log("✅ Amount Commitment Verifier deployed to:", amountVerifierAddress, "\n");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      transactionMembershipVerifier: membershipVerifierAddress,
      amountCommitmentVerifier: amountVerifierAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `verifiers-${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile, "\n");

  // Update .env file
  const envPath = path.join(__dirname, "../.env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Remove old verifier addresses if they exist
  envContent = envContent.replace(/MEMBERSHIP_VERIFIER_ADDRESS=.*/g, "");
  envContent = envContent.replace(/AMOUNT_VERIFIER_ADDRESS=.*/g, "");

  // Add new addresses
  envContent += `\n# ZK Proof Verifier Contracts (${network.name})\n`;
  envContent += `MEMBERSHIP_VERIFIER_ADDRESS=${membershipVerifierAddress}\n`;
  envContent += `AMOUNT_VERIFIER_ADDRESS=${amountVerifierAddress}\n`;

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Environment variables updated in backend/.env\n");

  // Verify contracts on Etherscan (if not local network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("⏳ Waiting 30 seconds before verifying contracts...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("\n🔍 Verifying Transaction Membership Verifier on Etherscan...");
      await run("verify:verify", {
        address: membershipVerifierAddress,
        constructorArguments: [],
      });
      console.log("✅ Transaction Membership Verifier verified");
    } catch (error: any) {
      console.log("⚠️  Verification failed:", error.message);
    }

    try {
      console.log("\n🔍 Verifying Amount Commitment Verifier on Etherscan...");
      await run("verify:verify", {
        address: amountVerifierAddress,
        constructorArguments: [],
      });
      console.log("✅ Amount Commitment Verifier verified");
    } catch (error: any) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }

  console.log("\n✅ Deployment Complete!");
  console.log("\n📝 Summary:");
  console.log("===========");
  console.log("Network:", network.name);
  console.log("Transaction Membership Verifier:", membershipVerifierAddress);
  console.log("Amount Commitment Verifier:", amountVerifierAddress);
  console.log("\n🎯 Next Steps:");
  console.log("1. Update PrivacyPoolHook.sol constructor with verifier addresses");
  console.log("2. Deploy PrivacyPoolHook: npx hardhat run scripts/deploy-privacy-hook.ts --network", network.name);
  console.log("3. Backend ProductionZKProofService is now ready to generate real proofs!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
