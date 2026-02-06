import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.authKey.deleteMany();
  await prisma.merkleTree.deleteMany();
  await prisma.stateChannel.deleteMany();
  await prisma.organization.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create Demo Organizations
  const techCorp = await prisma.organization.create({
    data: {
      name: 'TechCorp Solutions',
      subdomain: 'techcorp',
      walletAddress: '0x1234567890123456789012345678901234567890',
      payrollSchedule: 'WEEKLY',
      status: 'ACTIVE',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        enableZKProofs: true,
        enableYellowNetwork: true,
        enablePrivacyPool: true,
      },
      metadata: {
        industry: 'Technology',
        size: 'Medium',
        founded: '2020',
      },
    },
  });

  const cryptoStartup = await prisma.organization.create({
    data: {
      name: 'CryptoStartup Inc',
      subdomain: 'cryptostartup',
      walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      payrollSchedule: 'MONTHLY',
      status: 'ACTIVE',
      settings: {
        currency: 'ETH',
        timezone: 'Europe/London',
        enableZKProofs: true,
        enableYellowNetwork: true,
        enablePrivacyPool: false,
      },
      metadata: {
        industry: 'DeFi',
        size: 'Startup',
        founded: '2023',
      },
    },
  });

  console.log('✅ Created organizations:', techCorp.name, cryptoStartup.name);

  // Create Auth Keys for TechCorp
  const authKey1 = await prisma.authKey.create({
    data: {
      organizationId: techCorp.id,
      keyHash: await bcrypt.hash('DEMO-KEY-001', 10),
      label: 'Engineering Team',
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      metadata: {
        department: 'Engineering',
        issuer: 'HR Manager',
      },
    },
  });

  const authKey2 = await prisma.authKey.create({
    data: {
      organizationId: techCorp.id,
      keyHash: await bcrypt.hash('DEMO-KEY-002', 10),
      label: 'Sales Team',
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {
        department: 'Sales',
        issuer: 'HR Manager',
      },
    },
  });

  const authKey3 = await prisma.authKey.create({
    data: {
      organizationId: cryptoStartup.id,
      keyHash: await bcrypt.hash('DEMO-KEY-003', 10),
      label: 'Core Team',
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      metadata: {
        department: 'All',
        issuer: 'Founder',
      },
    },
  });

  console.log('✅ Created auth keys');

  // Create Employees for TechCorp
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        organizationId: techCorp.id,
        authKeyId: authKey1.id,
        employeeId: 'EMP001',
        email: 'alice@techcorp.io',
        name: 'Alice Johnson',
        department: 'Engineering',
        position: 'Senior Backend Developer',
        salary: 120000,
        walletAddresses: ['0x1111111111111111111111111111111111111111'],
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        onboardedAt: new Date(),
        metadata: {
          skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
          hireDate: '2022-03-15',
          manager: 'Bob Smith',
        },
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: techCorp.id,
        authKeyId: authKey1.id,
        employeeId: 'EMP002',
        email: 'bob@techcorp.io',
        name: 'Bob Smith',
        department: 'Engineering',
        position: 'Engineering Manager',
        salary: 150000,
        walletAddresses: ['0x2222222222222222222222222222222222222222'],
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        onboardedAt: new Date(),
        metadata: {
          skills: ['Management', 'Architecture', 'Go'],
          hireDate: '2021-01-10',
          reports: ['EMP001', 'EMP003'],
        },
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: techCorp.id,
        authKeyId: authKey2.id,
        employeeId: 'EMP003',
        email: 'carol@techcorp.io',
        name: 'Carol Williams',
        department: 'Sales',
        position: 'Sales Executive',
        salary: 90000,
        walletAddresses: ['0x3333333333333333333333333333333333333333'],
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        onboardedAt: new Date(),
        metadata: {
          skills: ['B2B Sales', 'Negotiation', 'CRM'],
          hireDate: '2022-06-01',
          manager: 'David Brown',
        },
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: techCorp.id,
        authKeyId: authKey1.id,
        employeeId: 'EMP004',
        email: 'david@techcorp.io',
        name: 'David Brown',
        department: 'Engineering',
        position: 'Frontend Developer',
        salary: 100000,
        walletAddresses: ['0x4444444444444444444444444444444444444444'],
        status: 'ACTIVE',
        kycStatus: 'PENDING',
        onboardedAt: new Date(),
        metadata: {
          skills: ['React', 'Next.js', 'TypeScript'],
          hireDate: '2023-09-15',
          manager: 'Bob Smith',
        },
      },
    }),
  ]);

  // Create Employees for CryptoStartup
  await Promise.all([
    prisma.employee.create({
      data: {
        organizationId: cryptoStartup.id,
        authKeyId: authKey3.id,
        employeeId: 'EMP101',
        email: 'founder@cryptostartup.io',
        name: 'Eva Martinez',
        department: 'Executive',
        position: 'CEO & Founder',
        salary: 200000,
        walletAddresses: ['0x5555555555555555555555555555555555555555'],
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        onboardedAt: new Date(),
        metadata: {
          skills: ['Leadership', 'DeFi', 'Smart Contracts'],
          hireDate: '2023-01-01',
        },
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: cryptoStartup.id,
        authKeyId: authKey3.id,
        employeeId: 'EMP102',
        email: 'frank@cryptostartup.io',
        name: 'Frank Chen',
        department: 'Engineering',
        position: 'Blockchain Developer',
        salary: 130000,
        walletAddresses: ['0x6666666666666666666666666666666666666666'],
        status: 'ACTIVE',
        kycStatus: 'APPROVED',
        onboardedAt: new Date(),
        metadata: {
          skills: ['Solidity', 'Rust', 'Web3.js'],
          hireDate: '2023-02-15',
          manager: 'Eva Martinez',
        },
      },
    }),
  ]);

  console.log('✅ Created employees');

  // Create Sample Transactions
  await Promise.all([
    prisma.transaction.create({
      data: {
        organizationId: techCorp.id,
        senderAddress: techCorp.walletAddress,
        recipientAddress: employees[0].walletAddresses[0],
        recipientEmployeeId: employees[0].employeeId,
        amount: 5000,
        currency: 'USDC',
        type: 'SALARY',
        status: 'COMPLETED',
        transactionHash: '0xabc123...',
        blockNumber: 12345678,
        metadata: {
          period: '2026-01',
          paymentType: 'monthly_salary',
        },
      },
    }),
    prisma.transaction.create({
      data: {
        organizationId: techCorp.id,
        senderAddress: techCorp.walletAddress,
        recipientAddress: employees[1].walletAddresses[0],
        recipientEmployeeId: employees[1].employeeId,
        amount: 6250,
        currency: 'USDC',
        type: 'SALARY',
        status: 'COMPLETED',
        transactionHash: '0xdef456...',
        blockNumber: 12345679,
        metadata: {
          period: '2026-01',
          paymentType: 'monthly_salary',
        },
      },
    }),
    prisma.transaction.create({
      data: {
        organizationId: techCorp.id,
        senderAddress: techCorp.walletAddress,
        recipientAddress: employees[2].walletAddresses[0],
        recipientEmployeeId: employees[2].employeeId,
        amount: 3750,
        currency: 'USDC',
        type: 'SALARY',
        status: 'PENDING',
        metadata: {
          period: '2026-02',
          paymentType: 'monthly_salary',
        },
      },
    }),
    prisma.transaction.create({
      data: {
        organizationId: techCorp.id,
        senderAddress: techCorp.walletAddress,
        recipientAddress: employees[0].walletAddresses[0],
        recipientEmployeeId: employees[0].employeeId,
        amount: 1000,
        currency: 'USDC',
        type: 'BONUS',
        status: 'COMPLETED',
        transactionHash: '0xghi789...',
        blockNumber: 12345680,
        metadata: {
          reason: 'Q4 Performance Bonus',
          quarter: 'Q4-2025',
        },
      },
    }),
  ]);

  console.log('✅ Created transactions');

  // Create Merkle Tree for TechCorp
  await prisma.merkleTree.create({
    data: {
      organizationId: techCorp.id,
      root: '0xmerkleroot1234567890abcdef',
      leaves: employees.slice(0, 4).map((emp) => emp.walletAddresses[0]),
      depth: 3,
      metadata: {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        employeeCount: 4,
      },
    },
  });

  console.log('✅ Created Merkle tree');

  // Create State Channels (Yellow Network)
  await Promise.all([
    prisma.stateChannel.create({
      data: {
        organizationId: techCorp.id,
        channelId: 'channel_tc_001',
        counterparty: employees[0].walletAddresses[0],
        balance: 5000,
        status: 'OPEN',
        metadata: {
          openedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        },
      },
    }),
    prisma.stateChannel.create({
      data: {
        organizationId: techCorp.id,
        channelId: 'channel_tc_002',
        counterparty: employees[1].walletAddresses[0],
        balance: 6250,
        status: 'OPEN',
        metadata: {
          openedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        },
      },
    }),
  ]);

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
  console.log('   Body: { "authKey": "DEMO-KEY-001", "email": "test@example.com", ... }');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
