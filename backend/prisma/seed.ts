import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.stateChannel.deleteMany();
  await prisma.merkleTree.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.authKey.deleteMany();
  await prisma.organization.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create Demo Organizations
  const techCorp = await prisma.organization.create({
    data: {
      organizationId: 'ORG-TECHCORP-001',
      name: 'TechCorp Solutions',
      registrationNumber: 'REG-TC-2020',
      country: 'United States',
      kycStatus: 'APPROVED',
      kycDocuments: ['doc1.pdf', 'doc2.pdf'],
      subscriptionTier: 'BUSINESS',
      employeeLimit: 50,
      adminWallets: [
        { address: '0x1234567890123456789012345678901234567890', role: 'admin', addedAt: new Date().toISOString() }
      ],
      treasuryAddresses: {
        ethereum: '0x1234567890123456789012345678901234567890',
        sui: '0xabc123',
        base: '0xdef456',
      },
      ensName: 'techcorp.eth',
      metadata: {
        industry: 'Technology',
        size: 'Medium',
        founded: '2020',
        subdomain: 'techcorp',
      },
    },
  });

  const cryptoStartup = await prisma.organization.create({
    data: {
      organizationId: 'ORG-CRYPTO-STARTUP-001',
      name: 'CryptoStartup Inc',
      registrationNumber: 'REG-CS-2023',
      country: 'United Kingdom',
      kycStatus: 'APPROVED',
      kycDocuments: ['kyc1.pdf'],
      subscriptionTier: 'STARTER',
      employeeLimit: 10,
      adminWallets: [
        { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'admin', addedAt: new Date().toISOString() }
      ],
      treasuryAddresses: {
        ethereum: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        sui: '0xghi789',
      },
      ensName: 'cryptostartup.eth',
      metadata: {
        industry: 'DeFi',
        size: 'Startup',
        founded: '2023',
        subdomain: 'cryptostartup',
      },
    },
  });

  console.log('✅ Created organizations:', techCorp.name, cryptoStartup.name);

  // Create Auth Keys
  const authKey1 = await prisma.authKey.create({
    data: {
      organizationId: techCorp.organizationId,
      keyHash: await bcrypt.hash('DEMO-KEY-001', 10),
      status: 'UNUSED',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {
        label: 'Engineering Team',
        department: 'Engineering',
        issuer: 'HR Manager',
      },
    },
  });

  const authKey2 = await prisma.authKey.create({
    data: {
      organizationId: techCorp.organizationId,
      keyHash: await bcrypt.hash('DEMO-KEY-002', 10),
      status: 'UNUSED',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {
        label: 'Sales Team',
        department: 'Sales',
        issuer: 'HR Manager',
      },
    },
  });

  const authKey3 = await prisma.authKey.create({
    data: {
      organizationId: cryptoStartup.organizationId,
      keyHash: await bcrypt.hash('DEMO-KEY-003', 10),
      status: 'UNUSED',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {
        label: 'Core Team',
        department: 'All',
        issuer: 'Founder',
      },
    },
  });

  console.log('✅ Created auth keys');

  // Create Employees
  const emp1 = await prisma.employee.create({
    data: {
      organizationId: techCorp.organizationId,
      employeeId: 'EMP001',
      authKeyHash: authKey1.keyHash,
      walletAddresses: {
        ethereum: '0x1111111111111111111111111111111111111111',
        sui: '0xemp001sui',
      },
      ensName: 'alice.techcorp.eth',
      status: 'ACTIVE',
      profileData: {
        email: 'alice@techcorp.io',
        name: 'Alice Johnson',
        department: 'Engineering',
        position: 'Senior Backend Developer',
        salary: 120000,
      },
      metadata: {
        skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
        hireDate: '2022-03-15',
        manager: 'Bob Smith',
      },
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      organizationId: techCorp.organizationId,
      employeeId: 'EMP002',
      authKeyHash: await bcrypt.hash('USED-KEY-002', 10),
      walletAddresses: {
        ethereum: '0x2222222222222222222222222222222222222222',
        sui: '0xemp002sui',
      },
      ensName: 'bob.techcorp.eth',
      status: 'ACTIVE',
      profileData: {
        email: 'bob@techcorp.io',
        name: 'Bob Smith',
        department: 'Engineering',
        position: 'Engineering Manager',
        salary: 150000,
      },
      metadata: {
        skills: ['Management', 'Architecture', 'Go'],
        hireDate: '2021-01-10',
        reports: ['EMP001', 'EMP003'],
      },
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      organizationId: techCorp.organizationId,
      employeeId: 'EMP003',
      authKeyHash: authKey2.keyHash,
      walletAddresses: {
        ethereum: '0x3333333333333333333333333333333333333333',
        sui: '0xemp003sui',
      },
      ensName: 'carol.techcorp.eth',
      status: 'ACTIVE',
      profileData: {
        email: 'carol@techcorp.io',
        name: 'Carol Williams',
        department: 'Sales',
        position: 'Sales Executive',
        salary: 90000,
      },
      metadata: {
        skills: ['B2B Sales', 'Negotiation', 'CRM'],
        hireDate: '2022-06-01',
        manager: 'David Brown',
      },
    },
  });

  const emp4 = await prisma.employee.create({
    data: {
      organizationId: techCorp.organizationId,
      employeeId: 'EMP004',
      authKeyHash: await bcrypt.hash('USED-KEY-004', 10),
      walletAddresses: {
        ethereum: '0x4444444444444444444444444444444444444444',
        sui: '0xemp004sui',
      },
      status: 'ACTIVE',
      profileData: {
        email: 'david@techcorp.io',
        name: 'David Brown',
        department: 'Engineering',
        position: 'Frontend Developer',
        salary: 100000,
      },
      metadata: {
        skills: ['React', 'Next.js', 'TypeScript'],
        hireDate: '2023-09-15',
        manager: 'Bob Smith',
      },
    },
  });

  const emp5 = await prisma.employee.create({
    data: {
      organizationId: cryptoStartup.organizationId,
      employeeId: 'EMP101',
      authKeyHash: authKey3.keyHash,
      walletAddresses: {
        ethereum: '0x5555555555555555555555555555555555555555',
        sui: '0xemp101sui',
      },
      ensName: 'eva.cryptostartup.eth',
      status: 'ACTIVE',
      profileData: {
        email: 'founder@cryptostartup.io',
        name: 'Eva Martinez',
        department: 'Executive',
        position: 'CEO & Founder',
        salary: 200000,
      },
      metadata: {
        skills: ['Leadership', 'DeFi', 'Smart Contracts'],
        hireDate: '2023-01-01',
      },
    },
  });

  const emp6 = await prisma.employee.create({
    data: {
      organizationId: cryptoStartup.organizationId,
      employeeId: 'EMP102',
      authKeyHash: await bcrypt.hash('USED-KEY-102', 10),
      walletAddresses: {
        ethereum: '0x6666666666666666666666666666666666666666',
        sui: '0xemp102sui',
      },
      ensName: 'frank.cryptostartup.eth',
      status: 'ACTIVE',
      profileData: {
        email: 'frank@cryptostartup.io',
        name: 'Frank Chen',
        department: 'Engineering',
        position: 'Blockchain Developer',
        salary: 130000,
      },
      metadata: {
        skills: ['Solidity', 'Rust', 'Web3.js'],
        hireDate: '2023-02-15',
        manager: 'Eva Martinez',
      },
    },
  });

  console.log('✅ Created employees');

  // Create Transactions
  await prisma.transaction.create({
    data: {
      transactionId: 'TX001',
      organizationId: techCorp.organizationId,
      fromEmployeeId: 'SYSTEM',
      toEmployeeId: emp1.employeeId,
      amount: '5000.00',
      currency: 'USDC',
      chain: 'ethereum',
      transactionType: 'PAYROLL',
      blockchainTxHash: '0xabc123',
      status: 'CONFIRMED',
      metadata: {
        period: '2026-01',
        paymentType: 'monthly_salary',
      },
    },
  });

  await prisma.transaction.create({
    data: {
      transactionId: 'TX002',
      organizationId: techCorp.organizationId,
      fromEmployeeId: 'SYSTEM',
      toEmployeeId: emp2.employeeId,
      amount: '6250.00',
      currency: 'USDC',
      chain: 'ethereum',
      transactionType: 'PAYROLL',
      blockchainTxHash: '0xdef456',
      status: 'CONFIRMED',
      metadata: {
        period: '2026-01',
        paymentType: 'monthly_salary',
      },
    },
  });

  await prisma.transaction.create({
    data: {
      transactionId: 'TX003',
      organizationId: techCorp.organizationId,
      fromEmployeeId: 'SYSTEM',
      toEmployeeId: emp3.employeeId,
      amount: '3750.00',
      currency: 'USDC',
      chain: 'ethereum',
      transactionType: 'PAYROLL',
      status: 'PENDING',
      metadata: {
        period: '2026-02',
        paymentType: 'monthly_salary',
      },
    },
  });

  await prisma.transaction.create({
    data: {
      transactionId: 'TX004',
      organizationId: techCorp.organizationId,
      fromEmployeeId: 'SYSTEM',
      toEmployeeId: emp1.employeeId,
      amount: '1000.00',
      currency: 'USDC',
      chain: 'ethereum',
      transactionType: 'PAYROLL',
      blockchainTxHash: '0xghi789',
      status: 'CONFIRMED',
      metadata: {
        reason: 'Q4 Performance Bonus',
        quarter: 'Q4-2025',
      },
    },
  });

  console.log('✅ Created transactions');

  // Create Merkle Tree
  await prisma.merkleTree.create({
    data: {
      organizationId: techCorp.organizationId,
      treeRoot: '0xmerkleroot1234567890abcdef',
      treeHeight: 3,
      leaves: [
        (emp1.walletAddresses as any).ethereum,
        (emp2.walletAddresses as any).ethereum,
        (emp3.walletAddresses as any).ethereum,
        (emp4.walletAddresses as any).ethereum,
      ],
      previousRoots: [],
    },
  });

  console.log('✅ Created Merkle tree');

  // Create State Channels
  await prisma.stateChannel.create({
    data: {
      channelId: 'channel_tc_001',
      employeeId: emp1.employeeId,
      organizationId: techCorp.organizationId,
      channelState: {
        balances: { employee: '5000', organization: '0' },
        nonce: 0,
        signatures: [],
      },
      depositAmount: '5000.00',
      currentBalance: '5000.00',
      status: 'OPEN',
    },
  });

  await prisma.stateChannel.create({
    data: {
      channelId: 'channel_tc_002',
      employeeId: emp2.employeeId,
      organizationId: techCorp.organizationId,
      channelState: {
        balances: { employee: '6250', organization: '0' },
        nonce: 0,
        signatures: [],
      },
      depositAmount: '6250.00',
      currentBalance: '6250.00',
      status: 'OPEN',
    },
  });

  console.log('✅ Created state channels');

  // Summary
  const orgCount = await prisma.organization.count();
  const empCount = await prisma.employee.count();
  const txCount = await prisma.transaction.count();
  const authKeyCount = await prisma.authKey.count();

  console.log('\n📊 Database Seeding Summary:');
  console.log(`   - Organizations: ${orgCount}`);
  console.log(`   - Employees: ${empCount}`);
  console.log(`   - Transactions: ${txCount}`);
  console.log(`   - Auth Keys: ${authKeyCount}`);
  console.log(`   - Merkle Trees: 1`);
  console.log(`   - State Channels: 2`);
  console.log('\n✨ Seeding completed successfully!\n');

  console.log('🔑 Demo Credentials:');
  console.log('\nOrganization 1: TechCorp Solutions');
  console.log('   - Subdomain: techcorp');
  console.log('   - Auth Key (Engineering): DEMO-KEY-001');
  console.log('   - Auth Key (Sales): DEMO-KEY-002');
  console.log('\nOrganization 2: CryptoStartup Inc');
  console.log('   - Subdomain: cryptostartup');
  console.log('   - Auth Key: DEMO-KEY-003');
  console.log('\nTest these in the API:');
  console.log('   POST /api/employees/onboard');
  console.log('   Body: { "authKey": "DEMO-KEY-001", "walletAddress": "0x...", "signature": "0x...", "chain": "ethereum" }');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
