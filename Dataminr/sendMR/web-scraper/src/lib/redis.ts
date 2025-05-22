// @ts-ignore
import config from 'config';
import Redis from 'ioredis';

const {
  redis: { host, port },
} = config;

export const REDIS_URL = `redis://${host}:${port}`;

export const redisClient = new Redis({
  db: 0,
  host,
  keyPrefix: 'web-scraper_',
  port,
});

export const redisRateLimit = new Redis({
  db: 0,
  host,
  keyPrefix: 'web-scraper_',
  port,
  enableOfflineQueue: false,
});
