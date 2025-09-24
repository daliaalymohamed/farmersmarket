// lib/utils/redis.js - CORRECTED VERSION
import { createClient } from 'redis';

let client = null;

const createRedisClient = async () => {
  if (!client) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 10000,     // 10 seconds (not too long)
        reconnectStrategy: (retries) => Math.min(retries * 1000, 5000),
        commandTimeout: 3000,
      }
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    client.on('disconnect', () => {
      console.log('❌ Disconnected from Redis');
    });

  }

  return client;
};

// Export the function that returns the connected client
export const getRedisClient = createRedisClient;

// Ensure the client is connected before any operation
// Prevents infinite wait during deployment or network issues.
export const ensureRedisConnected = async () => {
  const client = await getRedisClient();
  if (!client.isOpen) {
    const connectWithTimeout = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 5000);

      client.connect().then(
        () => {
          clearTimeout(timer);
          resolve(client);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });

    await connectWithTimeout;
  }
  return client;
};

// Utility functions for common Redis operations
export const RedisUtils = {
  async get(key) {
    try {
      const client = await ensureRedisConnected();
      return await client.get(key);
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  },

  // Set with optional TTL (in seconds which is equals to 1 hour by default)
  async set(key, value, ttl = 3600) {
    try {
      const client = await ensureRedisConnected();
      if (ttl) {
        return await client.setEx(key, ttl, value);
      } else {
        return await client.set(key, value);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  },

  async getJSON(key) {
    try {
      const data = await this.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getJSON error:', error);
      return null;
    }
  },

  async setJSON(key, value, ttl = 3600) {
    try {
      return await this.set(key, JSON.stringify(value), ttl);
    } catch (error) {
      console.error('Redis setJSON error:', error);
      return false;
    }
  },

  async del(key) {
    try {
      const client = await ensureRedisConnected();
      return await client.del(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  },

  async exists(key) {
    try {
      const client = await ensureRedisConnected();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }
};

// Graceful shutdown
export const closeRedisConnection = async () => {
  if (client && client.isOpen) {
    await client.quit();
    client = null;
    console.log('✅ Redis connection closed');
  }
};

export const TTL = {
  MINUTES: (n) => n * 60,
  HOURS: (n) => n * 3600,
  DAYS: (n) => n * 86400
};

// Default export for backward compatibility
export default RedisUtils;