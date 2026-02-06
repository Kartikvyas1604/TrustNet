import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function quickTest() {
  try {
    console.log('Testing NeonDB connection...\n');
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    
    // Try a raw query first
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw SQL query successful:', result);
    
    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📋 Tables in database:');
    console.table(tables);
    
    console.log('\n🎉 Database connection working!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();
