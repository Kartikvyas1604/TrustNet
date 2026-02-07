import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkAuthKey(authCode: string) {
  console.log(`\n🔍 Checking auth code: ${authCode}\n`);

  // Get all auth keys
  const allKeys = await prisma.authKey.findMany({
    include: { organization: true },
  });

  console.log(`📊 Total auth keys in database: ${allKeys.length}\n`);

  // Try to find matching key
  let matchedKey = null;
  for (const key of allKeys) {
    const isMatch = await bcrypt.compare(authCode, key.keyHash);
    if (isMatch) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    console.log('❌ No matching auth key found in database');
    console.log('   This code does not exist or was never generated\n');
    return;
  }

  console.log('✅ Auth key found!\n');
  console.log('📋 Key Details:');
  console.log(`   ID: ${matchedKey.id}`);
  console.log(`   Status: ${matchedKey.status}`);
  console.log(`   Organization: ${matchedKey.organization.name}`);
  console.log(`   Organization ID: ${matchedKey.organizationId}`);
  console.log(`   Organization KYC Status: ${matchedKey.organization.kycStatus}`);
  console.log(`   Organization Subscription: ${matchedKey.organization.subscriptionStatus}`);
  console.log(`   Assigned Employee ID: ${matchedKey.assignedEmployeeId || 'None'}`);
  console.log(`   Generated At: ${matchedKey.generatedAt}`);
  console.log(`   Used At: ${matchedKey.usedAt || 'Never'}`);
  console.log(`   Revoked At: ${matchedKey.revokedAt || 'Never'}`);
  console.log(`   Expires At: ${matchedKey.expiresAt || 'Never'}\n`);

  // Check why it might fail
  console.log('🔍 Validation Checks:');
  
  if (matchedKey.status !== 'UNUSED') {
    console.log(`   ❌ Status is ${matchedKey.status} (must be UNUSED)`);
  } else {
    console.log('   ✅ Status is UNUSED');
  }

  if (matchedKey.organization.kycStatus !== 'APPROVED') {
    console.log(`   ❌ Organization KYC status is ${matchedKey.organization.kycStatus} (must be APPROVED)`);
  } else {
    console.log('   ✅ Organization is APPROVED');
  }

  if (matchedKey.organization.subscriptionStatus !== 'ACTIVE') {
    console.log(`   ❌ Organization subscription is ${matchedKey.organization.subscriptionStatus} (must be ACTIVE)`);
  } else {
    console.log('   ✅ Organization subscription is ACTIVE');
  }

  console.log('\n');
}

// Get auth code from command line argument
const authCode = process.argv[2];

if (!authCode) {
  console.log('Usage: npx ts-node check-auth-key.ts <AUTH-CODE>');
  console.log('Example: npx ts-node check-auth-key.ts LCAH-WCYX-BSOM-GYDB');
  process.exit(1);
}

checkAuthKey(authCode)
  .then(() => {
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
