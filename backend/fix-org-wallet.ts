/**
 * Utility script to check and fix organization wallet configurations
 * Run with: npx ts-node fix-org-wallet.ts <email> <walletAddress>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixOrgWallet(email: string, walletAddress?: string) {
  try {
    console.log('\n🔍 Searching for organization...');
    
    const organization = await prisma.organization.findFirst({
      where: {
        adminEmail: email.toLowerCase(),
      },
    });

    if (!organization) {
      console.error('❌ Organization not found for email:', email);
      return;
    }

    console.log('\n✅ Organization found:');
    console.log('   ID:', organization.organizationId);
    console.log('   Name:', organization.name);
    console.log('   Email:', organization.adminEmail);
    console.log('   KYC Status:', organization.kycStatus);
    console.log('   Subscription:', organization.subscriptionStatus);

    const adminWallets = organization.adminWallets as any[];
    console.log('\n👛 Admin Wallets:');
    if (Array.isArray(adminWallets) && adminWallets.length > 0) {
      adminWallets.forEach((wallet: any, index: number) => {
        console.log(`   ${index + 1}. ${wallet.address}`);
        console.log(`      Role: ${wallet.role}`);
        console.log(`      Added: ${wallet.addedAt}`);
        console.log(`      Verified: ${wallet.verified}`);
      });
    } else {
      console.log('   ⚠️  No wallets configured');
    }

    // If wallet address provided and not in list, add it
    if (walletAddress) {
      const walletExists = adminWallets.some(
        (w: any) => w.address?.toLowerCase() === walletAddress.toLowerCase()
      );

      if (walletExists) {
        console.log('\n✅ Wallet already registered:', walletAddress);
      } else {
        console.log('\n🔧 Adding wallet to organization...');
        
        const updatedWallets = [...adminWallets, {
          address: walletAddress,
          role: 'primary',
          addedAt: new Date().toISOString(),
          verified: true,
        }];

        await prisma.organization.update({
          where: { organizationId: organization.organizationId },
          data: {
            adminWallets: updatedWallets,
          },
        });

        console.log('✅ Wallet added successfully!');
        console.log('   Address:', walletAddress);
        console.log('   You can now login with this wallet.');
      }
    }

    console.log('\n📊 Organization Status Summary:');
    console.log(`   Registration: ${organization.name ? '✅ Complete' : '❌ Incomplete'}`);
    console.log(`   KYC: ${organization.kycStatus === 'APPROVED' ? '✅ Approved' : `⚠️  ${organization.kycStatus}`}`);
    console.log(`   Wallet: ${adminWallets.length > 0 ? '✅ Connected' : '❌ Not Connected'}`);
    console.log(`   Payment: ${organization.paymentStatus === 'PAID' ? '✅ Paid' : `⚠️  ${organization.paymentStatus}`}`);
    
    if (organization.kycStatus !== 'APPROVED') {
      console.log('\n⚠️  WARNING: Organization is not approved yet.');
      console.log('   You can approve it manually with:');
      console.log(`   npx ts-node approve-org.ts ${organization.organizationId}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: npx ts-node fix-org-wallet.ts <email> [walletAddress]');
  console.log('');
  console.log('Examples:');
  console.log('  npx ts-node fix-org-wallet.ts kartik123@gmail.com');
  console.log('  npx ts-node fix-org-wallet.ts kartik123@gmail.com 0x1234...');
  process.exit(1);
}

const [email, walletAddress] = args;
checkAndFixOrgWallet(email, walletAddress);
