// lib/utils/redis.js
import { createClient } from 'redis';

let client = null;

const createRedisClient = async () => {
  if (!client) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,     // 5 seconds (Fastest possible)
        reconnectStrategy: (retries) => Math.min(retries * 500, 3000), // ✅ Faster reconnect
        commandTimeout: 2000,      // ✅ Faster command timeout
        keepAlive: 30000           // ✅ Keep connection alive
      },
      // ✅ Enable pipelining for multiple commands
      enableAutoPipelining: true
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
  // Get a value by key
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

  // Get and parse JSON value
  async getJSON(key) {
    try {
      const data = await this.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis getJSON error:', error);
      return null;
    }
  },

  // Set JSON value with optional TTL
  async setJSON(key, value, ttl = 3600) {
    try {
      return await this.set(key, JSON.stringify(value), ttl);
    } catch (error) {
      console.error('Redis setJSON error:', error);
      return false;
    }
  },

  // Delete a key
  async del(key) {
    try {
      const client = await ensureRedisConnected();
      return await client.unlink(key);
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  },

  // Delete keys matching a pattern
  async delByPattern(pattern) {
    try {
      const client = await ensureRedisConnected();

      // Use scan to find keys matching the pattern
      const stream = client.scanIterator({
        MATCH: pattern,
        COUNT: 100
      });

      const keys = [];
      for await (const key of stream) {
        keys.push(key);
      }

      // ✅ Only delete if we found keys
      if (keys.length === 0) {
        console.log(`🔍 No keys found for pattern: ${pattern}`);
        return 0;
      }

      // ✅ For redis@v4+: pass keys as array
      const result = await client.unlink(...keys); // ← Not spread, but array
      console.log(`🗑️ Deleted ${result} keys matching pattern: ${pattern}`);
      return result;

    } catch (error) {
      // 🛑 Handle specific case
      if (error.message.includes('wrong number of arguments')) {
        console.warn(`🔍 No keys found for pattern: ${pattern} (cache was already empty)`);
      } else {
        console.error('Redis delByPattern error:', error);
      }
      return 0;
    }
  },

  // Check if a key exists
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