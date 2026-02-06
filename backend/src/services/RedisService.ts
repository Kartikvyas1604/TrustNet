import Redis from 'ioredis';
import logger from '../utils/logger';

class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private connectionAttempted: boolean = false;

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.connectionAttempted) {
      return;
    }
    
    this.connectionAttempted = true;
    
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
        retryStrategy(times) {
          // Don't retry - fail fast
          if (times > 1) {
            return null;
          }
          return null;
        },
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (err: any) => {
        // Silent error logging - don't spam
        if (this.isConnected) {
          logger.error('Redis error:', { code: err.code, message: err.message });
        }
        this.isConnected = false;
      });

      this.client.on('close', () => {
        if (this.isConnected) {
          logger.warn('Redis connection closed');
        }
        this.isConnected = false;
      });

      // Test connection with timeout
      await this.client.connect();
      await Promise.race([
        this.client.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
      ]);
      logger.info('Redis connection verified');
    } catch (error) {
      logger.warn('Redis unavailable - caching disabled. This is optional and won\'t affect core functionality.');
      // Clean up the failed client
      if (this.client) {
        this.client.disconnect();
        this.client = null;
      }
      this.isConnected = false;
      // Don't throw - allow app to continue without Redis
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
   * Set a key-value pair with expiry
   */
  async setWithExpiry(key: string, value: string, ttl: number): Promise<void> {
    try {
      await this.client?.setex(key, ttl, value);
      logger.debug(`Set key with expiry: ${key}`);
    } catch (error) {
      logger.error('Failed to set key with expiry:', error);
      throw error;
    }
  }

  /**
   * Set a key-value pair with optional expiry
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client?.setex(key, ttl, value);
      } else {
        await this.client?.set(key, value);
      }
      logger.debug(`Set key: ${key}`);
    } catch (error) {
      logger.error('Failed to set key:', error);
      throw error;
    }
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client?.get(key) || null;
    } catch (error) {
      logger.error('Failed to get key:', error);
      return null;
    }
  }

  /**
   * Delete one or more keys
   */
  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await this.client?.del(...keys);
        logger.debug(`Deleted keys: ${keys.join(', ')}`);
      }
    } catch (error) {
      logger.error('Failed to delete keys:', error);
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
