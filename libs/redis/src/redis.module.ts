import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory() {
        this.redisClient = new Redis({
          host: '127.0.0.1', //process.env.REDIS_HOST || 'localhost',
          port: 6379,
          username: 'default', //process.env.REDIS_USERNAME || 'default',
          password: '12345678', //process.env.REDIS_PASSWORD,
          connectTimeout: 30000,
        });

        this.redisClient.on('ready', () => {
          console.log('Redis client connected and ready');
        });

        this.redisClient.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        return this.redisClient;
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
