import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client for NeonDB with Prisma v7
// Organization: org-sweet-thunder-69253070
// Project: still-wave-19438729

// Create a simple Prisma Client instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const connectDB = async (): Promise<void> => {
  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ NeonDB (PostgreSQL) connected successfully');
    console.log('📊 Organization: org-sweet-thunder-69253070');
    console.log('🗄️  Project: still-wave-19438729');

    // Graceful shutdown
    const cleanup = async () => {
      await prisma.$disconnect();
      console.log('NeonDB connection closed through app termination');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
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
