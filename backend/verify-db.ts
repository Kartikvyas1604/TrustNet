import 'dotenv/config';
import prisma from './src/config/database';

async function verifyDatabase() {
  console.log('🔍 Verifying NeonDB connection and schema...\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Successfully connected to NeonDB!');
    console.log('📊 Database: neondb');
    console.log('🌍 Region: eu-west-2 (AWS Europe - London)\n');
    
    // Check tables
    console.log('📋 Verifying database tables...\n');
    
    // Count records in each table
    const organizationCount = await prisma.organization.count();
    const employeeCount = await prisma.employee.count();
    const authKeyCount = await prisma.authKey.count();
    const transactionCount = await prisma.transaction.count();
    const merkleTreeCount = await prisma.merkleTree.count();
    const stateChannelCount = await prisma.stateChannel.count();
    
    console.log('✅ organizations table:', organizationCount, 'records');
    console.log('✅ employees table:', employeeCount, 'records');
    console.log('✅ auth_keys table:', authKeyCount, 'records');
    console.log('✅ transactions table:', transactionCount, 'records');
    console.log('✅ merkle_trees table:', merkleTreeCount, 'records');
    console.log('✅ state_channels table:', stateChannelCount, 'records');
    
    console.log('\n🎉 All tables created successfully!\n');
    console.log('📖 Database Schema:');
    console.log('   - Organization (with KYC, subscriptions, admin wallets)');
    console.log('   - Employee (with wallet addresses, privacy settings)');
    console.log('   - AuthKey (for employee onboarding)');
    console.log('   - Transaction (with ZK proof support)');
    console.log('   - MerkleTree (for privacy pools)');
    console.log('   - StateChannel (for off-chain payments)');
    
    console.log('\n🚀 Your database is ready to use!');
    console.log('💡 Start your server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
