import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function bootstrapTreasuryAddresses() {
  try {
    console.log('Starting treasury address bootstrap...');

    // Find all organizations
    const organizations = await prisma.organization.findMany();

    // Filter to those without treasury addresses or balances
    const orgsToUpdate = organizations.filter(
      org => !org.treasuryAddresses || !org.treasuryBalance
    );

    console.log(`Found ${orgsToUpdate.length} organizations to update (out of ${organizations.length} total)`);

    for (const org of orgsToUpdate) {
      console.log(`\nProcessing organization: ${org.name} (${org.organizationId})`);

      // Get admin wallet if exists
      const adminWallets = org.adminWallets as any;
      const primaryWallet = Array.isArray(adminWallets) && adminWallets.length > 0 
        ? adminWallets[0].address 
        : null;

      // For now, use the admin's primary wallet as treasury address for all chains
      // In production, you should generate separate addresses for each chain
      const treasuryAddresses = {
        ethereum: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
        sui: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
        base: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
        polygon: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
        arbitrum: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
        arc: primaryWallet || `0x${crypto.randomBytes(20).toString('hex')}`,
      };

      // Initialize treasury balances
      const treasuryBalance = {
        ethereum: '0',
        sui: '0',
        base: '0',
        polygon: '0',
        arbitrum: '0',
        arc: '0',
        total: '0',
      };

      await prisma.organization.update({
        where: { id: org.id },
        data: {
          treasuryAddresses,
          treasuryBalance,
        },
      });

      console.log(`✓ Updated treasury addresses for ${org.name}`);
      console.log(`  Treasury addresses:`, treasuryAddresses);
    }

    console.log('\n✅ Bootstrap completed successfully!');
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the bootstrap
bootstrapTreasuryAddresses()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
