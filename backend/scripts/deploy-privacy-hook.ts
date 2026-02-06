import { run } from "hardhat";
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy PrivacyPoolHook to Uniswap v4
 * 
 * Usage:
 * npx hardhat run scripts/deploy-privacy-hook.ts --network baseSepolia
 */
async function main() {
  console.log("🚀 Deploying PrivacyPoolHook to Uniswap v4...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get Uniswap v4 PoolManager address for the network
  const network = await ethers.provider.getNetwork();
  const poolManagerAddresses: Record<string, string> = {
    "84532": "0x7Da1D65F8B249183667cdE74C5CBD46dD38AA829", // Base Sepolia
    "11155111": "0x0000000000000000000000000000000000000000", // Sepolia (update when available)
    "8453": "0x0000000000000000000000000000000000000000", // Base Mainnet (update when available)
  };

  const poolManagerAddress = poolManagerAddresses[network.chainId.toString()];
  if (!poolManagerAddress || poolManagerAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error(`PoolManager address not configured for chain ID ${network.chainId}`);
  }

  console.log("Uniswap v4 PoolManager:", poolManagerAddress);

  // Load verifier addresses from deployment file or environment
  let membershipVerifierAddress = process.env.MEMBERSHIP_VERIFIER_ADDRESS;
  let amountVerifierAddress = process.env.AMOUNT_VERIFIER_ADDRESS;

  // Try to load from deployment file if not in env
  if (!membershipVerifierAddress || !amountVerifierAddress) {
    const verifierDeploymentFile = path.join(
      __dirname,
      "../deployments",
      `verifiers-${network.name}.json`
    );

    if (fs.existsSync(verifierDeploymentFile)) {
      const verifierDeployment = JSON.parse(fs.readFileSync(verifierDeploymentFile, "utf-8"));
      membershipVerifierAddress = membershipVerifierAddress || verifierDeployment.contracts.transactionMembershipVerifier;
      amountVerifierAddress = amountVerifierAddress || verifierDeployment.contracts.amountCommitmentVerifier;
      console.log("Loaded verifier addresses from deployment file");
    }
  }

  if (!membershipVerifierAddress || !amountVerifierAddress) {
    throw new Error(
      `Verifier addresses not found. Please deploy verifiers first:\n` +
      `npx hardhat run scripts/deploy-verifiers.ts --network ${network.name}\n` +
      `Or set MEMBERSHIP_VERIFIER_ADDRESS and AMOUNT_VERIFIER_ADDRESS in .env`
    );
  }

  console.log("Membership Verifier:", membershipVerifierAddress);
  console.log("Amount Verifier:", amountVerifierAddress);

  // Deploy PrivacyPoolHook
  console.log("\nDeploying PrivacyPoolHook...");
  const PrivacyPoolHook = await ethers.getContractFactory("PrivacyPoolHook");
  const privacyHook = await PrivacyPoolHook.deploy(
    poolManagerAddress,
    membershipVerifierAddress,
    amountVerifierAddress
  );
  await privacyHook.waitForDeployment();

  const hookAddress = await privacyHook.getAddress();
  console.log("✅ PrivacyPoolHook deployed to:", hookAddress);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    poolManager: poolManagerAddress,
    privacyPoolHook: hookAddress,
    membershipVerifier: membershipVerifierAddress,
    amountVerifier: amountVerifierAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: privacyHook.deploymentTransaction()?.hash,
  };

  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentDir,
    `privacy-hook-${network.name}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to:", deploymentFile);

  // Update .env file
  console.log("\n📝 Update your .env with these values:");
  console.log(`PRIVACY_POOL_HOOK_ADDRESS=${hookAddress}`);
  console.log(`UNISWAP_V4_POOL_MANAGER=${poolManagerAddress}`);

  // Verify contract on Etherscan (if API key available)
  if (process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY) {
    console.log("\n⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      console.log("Verifying contract on block explorer...");
      await run("verify:verify", {
        address: hookAddress,
        constructorArguments: [poolManagerAddress, membershipVerifierAddress, amountVerifierAddress],
      });
      console.log("✅ Contract verified!");
    } catch (error: any) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }

  console.log("\n✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Update .env with the hook address");
  console.log("2. Register your organization: call registerOrganization()");
  console.log("3. Initialize a privacy pool with your organization ID");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
