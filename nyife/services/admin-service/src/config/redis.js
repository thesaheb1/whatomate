'use strict';

const Redis = require('ioredis');
const { createLogger } = require('../../../../shared/logger');
const logger = createLogger('admin-redis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  keyPrefix: 'nyife:admin:',
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

const connectRedis = async () => { await redis.connect(); };

module.exports = { redis, connectRedis };
