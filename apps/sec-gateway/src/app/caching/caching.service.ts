import { Injectable, Inject } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class CachingService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType) {}

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.redisClient.get(key);
      return result as string | null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    try {
      await this.redisClient.setEx(key, ttl, value);
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }
}
