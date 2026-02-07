import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAuthKey(authCode: string) {
  console.log(`\n🔄 Resetting auth code: ${authCode}\n`);

  // Find matching key
  const allKeys = await prisma.authKey.findMany({
    include: { organization: true },
  });

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
    return;
  }

  console.log(`✅ Found auth key: ${matchedKey.id}`);
  console.log(`   Current status: ${matchedKey.status}`);
  console.log(`   Assigned to employee: ${matchedKey.assignedEmployeeId || 'None'}\n`);

  // If assigned to an employee, ask for confirmation
  if (matchedKey.assignedEmployeeId) {
    console.log('⚠️  WARNING: This key is assigned to an employee!');
    console.log('   Resetting will allow the key to be reused, but the employee will still exist.\n');
  }

  // Reset the key
  await prisma.authKey.update({
    where: { id: matchedKey.id },
    data: {
      status: 'UNUSED',
      assignedEmployeeId: null,
      usedAt: null,
    },
  });

  console.log('✅ Auth key reset successfully!');
  console.log('   Status: UNUSED');
  console.log('   Assigned Employee: None');
  console.log('   Used At: null\n');
  console.log('🎉 You can now use this auth code again!\n');
}

// Get auth code from command line argument
const authCode = process.argv[2];

if (!authCode) {
  console.log('Usage: npx ts-node reset-auth-key.ts <AUTH-CODE>');
  console.log('Example: npx ts-node reset-auth-key.ts LCAH-WCYX-BSOM-GYDB');
  console.log('\nThis will reset the auth key to UNUSED status so it can be used again.');
  process.exit(1);
}

resetAuthKey(authCode)
  .then(() => {
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
