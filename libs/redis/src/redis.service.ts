import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async setRedisNotExpire(key: string, value: string): Promise<void> {
    try {
      await this.redisClient.set(key, value);
    } catch (error) {
      throw new Error('Redis Set Key Failed');
    }
  }

  async setRedisWithExpire(
    key: string,
    value: string,
    expireInSeconds: number,
  ): Promise<void> {
    try {
      await this.redisClient.set(key, value, 'EX', expireInSeconds);
    } catch (error) {
      throw new Error('Redis Set Key with Expire Failed');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.redisClient.get(key);
      return value;
    } catch (error) {
      throw new Error('Redis Get Key Failed');
    }
  }
}
