import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client for NeonDB
// Organization: org-sweet-thunder-69253070
// Project: still-wave-19438729
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

export const connectDB = async (): Promise<void> => {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ NeonDB (PostgreSQL) connected successfully');
    console.log('📊 Organization: org-sweet-thunder-69253070');
    console.log('🗄️  Project: still-wave-19438729');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      console.log('NeonDB connection closed through app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await prisma.$disconnect();
      console.log('NeonDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to connect to NeonDB:', error);
    process.exit(1);
  }
};

// Disconnect function for cleanup
export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  console.log('⚠️  NeonDB disconnected');
};

export default prisma;
