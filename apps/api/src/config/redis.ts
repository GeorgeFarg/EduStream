import Redis from 'ioredis';

export const redis = new Redis('redis://localhost:6379');
export const redisClient = redis;

redis.on('error', (err) => console.error('Redis Client Error', err));
