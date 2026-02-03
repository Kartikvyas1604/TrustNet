import Redis from 'ioredis';
import logger from '../utils/logger';

class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError(err) {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      // Test connection
      await this.client.ping();
      logger.info('Redis connection verified');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  /**
   * Cache ENS name resolution
   */
  async cacheENSName(address: string, name: string, ttl: number = 3600): Promise<void> {
    try {
      const key = `ens:address:${address.toLowerCase()}`;
      await this.client?.setex(key, ttl, name);
      logger.debug(`Cached ENS name: ${address} -> ${name}`);
    } catch (error) {
      logger.error('Failed to cache ENS name:', error);
    }
  }

  /**
   * Get cached ENS name
   */
  async getCachedENSName(address: string): Promise<string | null> {
    try {
      const key = `ens:address:${address.toLowerCase()}`;
      return await this.client?.get(key) || null;
    } catch (error) {
      logger.error('Failed to get cached ENS name:', error);
      return null;
    }
  }

  /**
   * Cache reverse ENS resolution (address from name)
   */
  async cacheENSAddress(name: string, address: string, ttl: number = 3600): Promise<void> {
    try {
      const key = `ens:name:${name.toLowerCase()}`;
      await this.client?.setex(key, ttl, address.toLowerCase());
      logger.debug(`Cached ENS address: ${name} -> ${address}`);
    } catch (error) {
      logger.error('Failed to cache ENS address:', error);
    }
  }

  /**
   * Get cached address from ENS name
   */
  async getCachedENSAddress(name: string): Promise<string | null> {
    try {
      const key = `ens:name:${name.toLowerCase()}`;
      return await this.client?.get(key) || null;
    } catch (error) {
      logger.error('Failed to get cached ENS address:', error);
      return null;
    }
  }

  /**
   * Cache employee balance
   */
  async cacheBalance(employeeId: string, chain: string, balance: string, ttl: number = 300): Promise<void> {
    try {
      const key = `balance:${employeeId}:${chain}`;
      await this.client?.setex(key, ttl, balance);
      logger.debug(`Cached balance for ${employeeId} on ${chain}`);
    } catch (error) {
      logger.error('Failed to cache balance:', error);
    }
  }

  /**
   * Get cached balance
   */
  async getCachedBalance(employeeId: string, chain: string): Promise<string | null> {
    try {
      const key = `balance:${employeeId}:${chain}`;
      return await this.client?.get(key) || null;
    } catch (error) {
      logger.error('Failed to get cached balance:', error);
      return null;
    }
  }

  /**
   * Store session data
   */
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.client?.setex(key, ttl, JSON.stringify(data));
      logger.debug(`Session stored: ${sessionId}`);
    } catch (error) {
      logger.error('Failed to store session:', error);
      throw error;
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<any | null> {
    try {
      const key = `session:${sessionId}`;
      const data = await this.client?.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.client?.del(key);
      logger.debug(`Session deleted: ${sessionId}`);
    } catch (error) {
      logger.error('Failed to delete session:', error);
    }
  }

  /**
   * Store rate limit data
   */
  async incrementRateLimit(key: string, window: number): Promise<number> {
    try {
      const rateLimitKey = `ratelimit:${key}`;
      const current = await this.client?.incr(rateLimitKey);
      
      if (current === 1) {
        await this.client?.expire(rateLimitKey, window);
      }
      
      return current || 0;
    } catch (error) {
      logger.error('Failed to increment rate limit:', error);
      return 0;
    }
  }

  /**
   * Clear all cached data for an employee
   */
  async clearEmployeeCache(employeeId: string): Promise<void> {
    try {
      const pattern = `*:${employeeId}:*`;
      const keys = await this.client?.keys(pattern);
      
      if (keys && keys.length > 0) {
        await this.client?.del(...keys);
        logger.debug(`Cleared cache for employee: ${employeeId}`);
      }
    } catch (error) {
      logger.error('Failed to clear employee cache:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Failed to disconnect Redis:', error);
    }
  }

  /**
   * Check if Redis is connected
   */
  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export default new RedisService();
