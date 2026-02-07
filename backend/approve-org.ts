/**
 * Utility script to approve an organization
 * Run with: npx ts-node approve-org.ts <organizationId or email>
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function approveOrganization(identifier: string) {
  try {
    console.log('\n🔍 Searching for organization...');
    
    let organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { organizationId: identifier },
          { adminEmail: identifier.toLowerCase() },
        ],
      },
    });

    if (!organization) {
      console.error('❌ Organization not found:', identifier);
      return;
    }

    console.log('\n✅ Organization found:');
    console.log('   ID:', organization.organizationId);
    console.log('   Name:', organization.name);
    console.log('   Email:', organization.adminEmail);
    console.log('   Current KYC Status:', organization.kycStatus);

    if (organization.kycStatus === 'APPROVED') {
      console.log('\n✅ Organization is already approved!');
      return;
    }

    console.log('\n🔧 Approving organization...');

    // Generate auth keys if not already generated
    const existingKeys = await prisma.authKey.count({
      where: { organizationId: organization.organizationId },
    });

    if (existingKeys === 0) {
      console.log('\n🔑 Generating auth keys...');
      
      const authKeyRecords = [];
      const employeeLimit = organization.employeeLimit || 10;

      for (let i = 0; i < employeeLimit; i++) {
        const key = `${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const keyHash = await bcrypt.hash(key, 10);

        authKeyRecords.push({
          keyHash,
          organizationId: organization.organizationId,
          status: 'UNUSED',
          generatedAt: new Date(),
        });

        console.log(`   Generated key ${i + 1}/${employeeLimit}: ${key}`);
      }

      await prisma.authKey.createMany({
        data: authKeyRecords,
      });

      console.log(`✅ Generated ${employeeLimit} auth keys`);
    } else {
      console.log(`✅ Auth keys already exist (${existingKeys} keys)`);
    }

    // Update organization status
    await prisma.organization.update({
      where: { organizationId: organization.organizationId },
      data: {
        kycStatus: 'APPROVED',
        subscriptionStatus: 'ACTIVE',
        verifiedAt: new Date(),
      },
    });

    console.log('\n✅ Organization approved successfully!');
    console.log('   Status: APPROVED');
    console.log('   Subscription: ACTIVE');
    console.log(`   Auth Keys: ${existingKeys || organization.employeeLimit} available`);
    console.log('\n🎉 Organization can now login and manage employees!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: npx ts-node approve-org.ts <organizationId or email>');
  console.log('');
  console.log('Examples:');
  console.log('  npx ts-node approve-org.ts org-abc123');
  console.log('  npx ts-node approve-org.ts kartik123@gmail.com');
  process.exit(1);
}

const identifier = args[0];
approveOrganization(identifier);
