import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDB } from './config/database';
import logger from './utils/logger';
import redisService from './services/RedisService';
import ensService from './services/ENSService';
import webSocketService from './services/WebSocketService';
import cronService from './services/CronService';
import yellowNetworkService from './services/YellowNetworkService';
import { suiBlockchainService } from './services/SuiBlockchainService';
import { initializeWebSocket } from './services/websocket.service';
import { getSuiContractService } from './services/sui-contract.service';
import { getStripeService } from './services/stripe.service';
import { cleanupExpiredSessions } from './middleware/auth';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

export async function startServer() {
  try {
    logger.info('Starting TrustNet Backend Server...');

    // Create Express app
    const app = createApp();

    // Create HTTP server for WebSocket
    const httpServer = http.createServer(app);

    // ======================
    // DATABASE & CACHE
    // ======================
    await connectDB();
    logger.info('✓ MongoDB connected');

    await redisService.connect();
    if (redisService.isHealthy()) {
      logger.info('✓ Redis connected');
    } else {
      logger.info('⚠ Redis disabled - caching unavailable (optional feature)');
    }

    // ======================
    // BLOCKCHAIN SERVICES
    // ======================
    await ensService.initialize();
    logger.info('✓ ENS Service initialized');

    yellowNetworkService.monitorChannels();
    logger.info('✓ Yellow Network Service initialized');

    if (suiBlockchainService.isReady()) {
      logger.info('✓ Sui Blockchain Service ready');
    } else {
      logger.warn('⚠ Sui Blockchain Service running in simulated mode');
    }

    const suiService = getSuiContractService();
    logger.info('✓ Sui Contract Service initialized');

    // ======================
    // PAYMENT & IDENTITY
    // ======================
    const stripeService = getStripeService();
    logger.info('✓ Stripe Payment Service initialized');

    // ======================
    // WEBSOCKET
    // ======================
    webSocketService.initialize(httpServer);
    logger.info('✓ WebSocket Service (legacy) initialized');

    const wsService = initializeWebSocket(httpServer);
    logger.info('✓ WebSocket Service (new) initialized');

    // ======================
    // BACKGROUND JOBS
    // ======================
    logger.info('✓ Transaction Orchestration Service ready');

    cleanupExpiredSessions();
    logger.info('✓ Auth session cleanup initialized');

    cronService.initialize();
    cronService.startAll();
    logger.info('✓ Cron Service initialized and started');

    // ======================
    // START SERVER
    // ======================
    httpServer.listen(PORT, () => {
      logger.info('\n' + '='.repeat(60));
      logger.info('  TrustNet Backend API Server');
      logger.info('='.repeat(60));
      logger.info(`  Server: http://localhost:${PORT}`);
      logger.info(`  API Version: v1`);
      logger.info('  Database: MongoDB');
      logger.info(`  Redis: ${redisService.isHealthy() ? 'Connected' : 'Disconnected'}`);
      logger.info('  WebSocket: Active');
      logger.info('  Cron Jobs: Running');
      logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('');
      logger.info('  API Endpoints:');
      logger.info('  - Health: GET /health');
      logger.info('  - API v1: /api/v1/*');
      logger.info('  - Auth: /api/v1/auth');
      logger.info('  - Organizations: /api/v1/organizations');
      logger.info('  - Employees: /api/v1/employees');
      logger.info('  - Transactions: /api/v1/transactions');
      logger.info('  - Treasury: /api/v1/treasury');
      logger.info('  - Admin: /api/v1/admin');
      logger.info('');
      logger.info('  Blockchain Integrations:');
      logger.info('  - Yellow Network (State channels)');
      logger.info('  - Uniswap v4 (Privacy pools)');
      logger.info('  - Sui Blockchain (Settlement layer)');
      logger.info('  - ENS (Identity)');
      logger.info('='.repeat(60) + '\n');
    });

    // Graceful shutdown
    setupGracefulShutdown(httpServer);

    return httpServer;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

function setupGracefulShutdown(server: http.Server) {
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received, cleaning up...`);

    try {
      // Stop accepting new connections
      server.close(() => {
        logger.info('✓ HTTP server closed');
      });

      // Stop cron jobs
      cronService.stopAll();
      logger.info('✓ Cron jobs stopped');

      // Close Redis connection
      try {
        await redisService.disconnect();
        logger.info('✓ Redis disconnected');
      } catch (error) {
        logger.warn('⚠ Redis disconnect skipped (was not connected)');
      }

      // WebSocket connections will be closed when server closes
      logger.info('✓ WebSocket cleanup initiated');

      logger.info('✓ Cleanup complete, exiting...');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start server if running directly
if (require.main === module) {
  startServer();
}
