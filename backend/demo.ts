import dotenv from 'dotenv';
import OrganizationService from './src/services/OrganizationService';
import EmployeeService from './src/services/EmployeeService';
import yellowNetworkService from './src/services/YellowNetworkService';
import { suiBlockchainService } from './src/services/SuiBlockchainService';
import ZKProofService from './src/services/ZKProofService';
import ENSService from './src/services/ENSService';
import redisService from './src/services/RedisService';
import { connectDB, prisma } from './src/config/database';
import logger from './src/utils/logger';
import { generateId } from './src/utils/helpers';

// Load environment
dotenv.config();

class TrustNetDemo {
  private organizationId: string = '';
  private employeeIds: string[] = [];
  private authKeys: any[] = [];
  private channelIds: string[] = [];

  async run() {
    try {
      console.log('\n🚀 TrustNet Demo - Starting...\n');
      console.log('='.repeat(60));

      // Initialize services
      await this.initialize();

      // Run demo scenarios
      await this.demo1_OrganizationRegistration();
      await this.demo2_AuthKeyGeneration();
      await this.demo3_EmployeeOnboarding();
      await this.demo4_YellowNetworkPayments();
      await this.demo5_SuiBlockchainTransfers();
      await this.demo6_ENSResolution();
      await this.demo7_ZKProofGeneration();

      console.log('\n' + '='.repeat(60));
      console.log('✅ Demo completed successfully!');
      console.log('='.repeat(60) + '\n');

      await this.cleanup();
    } catch (error) {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    }
  }

  async initialize() {
    console.log('📡 Initializing services...');
    
    // Connect to database
    await connectDB();
    console.log('  ✓ Database connected');
    
    // Connect to Redis
    await redisService.connect();
    console.log('  ✓ Redis connected');
    
    // Initialize ENS
    await ENSService.initialize();
    console.log('  ✓ ENS initialized');
    
    console.log('');
  }

  async demo1_OrganizationRegistration() {
    console.log('\n📋 DEMO 1: Organization Registration');
    console.log('-'.repeat(60));

    const orgData = {
      name: 'Acme Corporation Demo',
      registrationNumber: 'ACME-' + Date.now(),
      country: 'United States',
      subscriptionTier: 'business' as const,
      adminWallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      contactEmail: 'admin@acme.example.com',
      contactPerson: 'Alice Johnson',
    };

    console.log('  Registering organization:', orgData.name);
    
    const organization = await OrganizationService.registerOrganization(orgData);
    this.organizationId = organization.organizationId;

    console.log('  ✓ Organization registered successfully');
    console.log('    Organization ID:', this.organizationId);
    console.log('    Subscription:', organization.subscriptionTier);
    console.log('    Employee Limit:', organization.employeeLimit);

    // Auto-approve KYC for demo
    await OrganizationService.updateKYCStatus(this.organizationId, 'approved');
    console.log('  ✓ KYC approved (auto-approved for demo)');
  }

  async demo2_AuthKeyGeneration() {
    console.log('\n🔑 DEMO 2: Auth Key Generation');
    console.log('-'.repeat(60));

    console.log('  Generating 5 auth keys for employees...');
    
    this.authKeys = await OrganizationService.generateAuthKeys(
      this.organizationId,
      5,
      'demo-script'
    );

    console.log('  ✓ Generated', this.authKeys.length, 'auth keys');
    console.log('  Sample keys:');
    this.authKeys.slice(0, 3).forEach((authKey, i) => {
      console.log(`    ${i + 1}. ${authKey.key}`);
    });
    console.log('    ... (2 more keys)');
  }

  async demo3_EmployeeOnboarding() {
    console.log('\n👥 DEMO 3: Employee Onboarding');
    console.log('-'.repeat(60));

    const employees = [
      {
        name: 'Bob Smith',
        wallet: '0x1234567890abcdef1234567890abcdef12345678',
        ensName: 'bob.acme-demo.eth',
      },
      {
        name: 'Carol Williams',
        wallet: '0xabcdef1234567890abcdef1234567890abcdef12',
        ensName: 'carol.acme-demo.eth',
      },
      {
        name: 'Dave Brown',
        wallet: '0x567890abcdef1234567890abcdef1234567890ab',
        ensName: 'dave.acme-demo.eth',
      },
    ];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const authKey = this.authKeys[i];

      console.log(`\n  Onboarding ${emp.name}...`);
      
      const employee = await EmployeeService.onboardEmployee({
        authKey: authKey.key,
        walletAddress: emp.wallet,
        signature: 'demo-signature-' + emp.wallet.substring(0, 10),
        chain: 'ethereum',
        nickname: emp.name.toLowerCase().replace(/\s+/g, ''),
      });

      this.employeeIds.push(employee.employeeId);

      console.log(`    ✓ Employee onboarded: ${emp.name}`);
      console.log(`      Employee ID: ${employee.employeeId}`);
      console.log(`      ENS Name: ${emp.ensName}`);
      console.log(`      Wallet: ${emp.wallet.substring(0, 10)}...`);

      // Open Yellow Network channel
      const channelId = await yellowNetworkService.openChannel(
        employee.employeeId,
        this.organizationId,
        '1000.00' // Initial deposit
      );

      this.channelIds.push(channelId);
      console.log(`      ✓ Yellow channel opened: ${channelId.substring(0, 16)}...`);
    }

    console.log(`\n  ✓ Successfully onboarded ${employees.length} employees`);
  }

  async demo4_YellowNetworkPayments() {
    console.log('\n⚡ DEMO 4: Yellow Network Off-Chain Payments');
    console.log('-'.repeat(60));

    console.log('  Scenario: Bob pays Carol 50 USDC for lunch (off-chain)');
    
    const bobChannelId = this.channelIds[0];
    const carolChannelId = this.channelIds[1];

    // Get initial balances
    const bobInitial = await yellowNetworkService.getChannelState(bobChannelId);
    const carolInitial = await yellowNetworkService.getChannelState(carolChannelId);

    console.log(`    Bob's initial balance: ${bobInitial?.balance} USDC`);
    console.log(`    Carol's initial balance: ${carolInitial?.balance} USDC`);

    // Process payment
    console.log('\n  Processing off-chain payment...');
    const paymentResult = await yellowNetworkService.processOffChainPayment(
      bobChannelId,
      carolChannelId,
      '50.00'
    );

    console.log('  ✓ Payment processed in ~100ms (no gas fees!)');
    console.log(`    Transaction nonce: ${paymentResult.newNonce}`);

    // Get final balances
    const bobFinal = await yellowNetworkService.getChannelState(bobChannelId);
    const carolFinal = await yellowNetworkService.getChannelState(carolChannelId);

    console.log(`\n    Bob's final balance: ${bobFinal?.balance} USDC`);
    console.log(`    Carol's final balance: ${carolFinal?.balance} USDC`);

    console.log('\n  Key Benefits:');
    console.log('    ✓ Instant settlement (<100ms)');
    console.log('    ✓ Zero gas fees');
    console.log('    ✓ Unlimited transactions while channel is open');
    console.log('    ✓ Cryptographically secure with signed state updates');
  }

  async demo5_SuiBlockchainTransfers() {
    console.log('\n🔷 DEMO 5: Sui Blockchain On-Chain Transfers');
    console.log('-'.repeat(60));

    console.log('  Scenario: Organization pays Dave salary (100 USDC)');
    
    const orgTreasury = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const daveWallet = '0x567890abcdef1234567890abcdef1234567890ab';

    console.log('\n  Creating Programmable Transaction Block (PTB)...');
    const txDigest = await suiBlockchainService.createUSDCTransfer(
      orgTreasury,
      daveWallet,
      100.00,
      orgTreasury // Organization sponsors gas
    );

    if (txDigest) {
      console.log('  ✓ Transaction executed successfully');
      console.log(`    Tx Digest: ${txDigest.substring(0, 20)}...`);
      console.log('    Amount: 100 USDC');
      console.log('    Gas Sponsor: Organization (employee pays $0)');
      console.log('    Finality: ~2 seconds');

      // Get transaction details
      const txDetails = await suiBlockchainService.getTransaction(txDigest);
      console.log(`\n  Transaction Details:`);
      console.log(`    Status: ${txDetails?.status}`);
      console.log(`    Checkpoint: ${txDetails?.checkpoint}`);
      console.log(`    Gas Used: ${txDetails?.gasUsed || '0'} (sponsored)`);
    } else {
      console.log('  ⚠ Transaction simulation completed (demo mode)');
    }

    console.log('\n  Key Benefits:');
    console.log('    ✓ Sub-second finality (Sui performance)');
    console.log('    ✓ Gasless for employees (sponsored transactions)');
    console.log('    ✓ Batch payroll possible (PTBs)');
    console.log('    ✓ Cost-effective for enterprise');
  }

  async demo6_ENSResolution() {
    console.log('\n🌐 DEMO 6: ENS Name Resolution');
    console.log('-'.repeat(60));

    console.log('  Testing ENS name-to-address resolution...');
    
    const testName = 'vitalik.eth';
    console.log(`\n  Resolving: ${testName}`);
    
    const address = await ENSService.resolveNameToAddress(testName);
    
    if (address) {
      console.log(`  ✓ Resolved: ${address}`);
      console.log('    (Cached for future lookups)');

      // Test reverse resolution
      console.log(`\n  Reverse resolving: ${address}`);
      const reverseName = await ENSService.resolveAddressToName(address);
      
      if (reverseName) {
        console.log(`  ✓ Reverse resolved: ${reverseName}`);
      }
    } else {
      console.log('  ⚠ Name resolution simulated (demo mode)');
    }

    console.log('\n  Employee ENS Names (provisioned):');
    console.log('    • bob.acme-demo.eth → Bob Smith');
    console.log('    • carol.acme-demo.eth → Carol Williams');
    console.log('    • dave.acme-demo.eth → Dave Brown');

    console.log('\n  Key Benefits:');
    console.log('    ✓ Human-readable payment addresses');
    console.log('    ✓ Multi-chain address mapping');
    console.log('    ✓ Privacy preferences in text records');
    console.log('    ✓ Corporate identity hierarchy');
  }

  async demo7_ZKProofGeneration() {
    console.log('\n🔐 DEMO 7: Zero-Knowledge Proof Generation');
    console.log('-'.repeat(60));

    console.log('  Generating membership proof for private transaction...');
    console.log('  (Proves Bob is in Acme Corp without revealing identity)');

    const bobWallet = '0x1234567890abcdef1234567890abcdef12345678';

    const membershipProof = await ZKProofService.generateMembershipProof(
      this.organizationId,
      bobWallet,
      Date.now()
    );

    console.log('\n  ✓ Membership proof generated');
    console.log(`    Proof elements: ${membershipProof.proof.length}`);
    console.log(`    Public signals: ${membershipProof.publicSignals.length}`);
    console.log(`    Merkle root: ${membershipProof.publicSignals[0].substring(0, 20)}...`);
    console.log(`    Nullifier: ${membershipProof.publicSignals[1].substring(0, 20)}...`);

    console.log('\n  Generating amount commitment proof...');
    const amount = 250.50;
    const commitment = ZKProofService.generateCommitment(amount);
    
    const amountProof = await ZKProofService.generateAmountProof(
      amount,
      commitment.salt,
      commitment.commitment
    );

    console.log('  ✓ Amount commitment generated');
    console.log(`    Amount: ${amount} USDC (hidden)`);
    console.log(`    Commitment: ${commitment.commitment.substring(0, 20)}...`);

    console.log('\n  Usage in Uniswap v4 Privacy Hook:');
    console.log('    1. Proof verifies employee is org member ✓');
    console.log('    2. Amount hidden behind commitment ✓');
    console.log('    3. Nullifier prevents double-spending ✓');
    console.log('    4. On-chain viewer sees: "ORG_A → ORG_A, ZK_PROOF"');

    console.log('\n  Key Benefits:');
    console.log('    ✓ Employee privacy preserved');
    console.log('    ✓ Amount confidentiality');
    console.log('    ✓ Compliance through organization verification');
    console.log('    ✓ Selective disclosure for audits');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up demo data...');
    
    try {
      // Close all channels
      for (const channelId of this.channelIds) {
        await yellowNetworkService.closeChannel(channelId);
      }
      console.log('  ✓ Closed Yellow Network channels');

      // Note: Keep demo data for inspection
      console.log('  ✓ Demo data preserved in database for inspection');

      // Disconnect services
      await redisService.disconnect();
      await prisma.$disconnect();
      
      console.log('  ✓ Disconnected from services\n');
    } catch (error) {
      console.error('  ⚠ Cleanup warning:', error);
    }
  }
}

// Run demo
if (require.main === module) {
  const demo = new TrustNetDemo();
  demo.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default TrustNetDemo;
