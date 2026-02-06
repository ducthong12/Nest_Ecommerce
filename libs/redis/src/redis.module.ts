import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Module({
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        let client: Redis;

        console.log('DEBUG ENV:', {
          sentinels: process.env.REDIS_SENTINELS,
          master: process.env.REDIS_MASTER_NAME,
          type: typeof process.env.REDIS_SENTINELS,
        });

        const sentinelString = process.env.REDIS_SENTINELS;

        if (sentinelString) {
          console.log('Connecting to Redis via Sentinel nodes');
          const sentinels = sentinelString.split(',').map((item) => {
            const [host, port] = item.split(':');
            return { host, port: parseInt(port, 10) || 26379 };
          });

          client = new Redis({
            sentinels: sentinels,
            name: process.env.REDIS_MASTER_NAME || 'mymaster',
            password: process.env.REDIS_PASSWORD,
            sentinelPassword: process.env.REDIS_PASSWORD,
            role: 'master',
            connectTimeout: 30000,
            retryStrategy: (times) => Math.min(times * 50, 2000),
          });
        } else {
          console.log('Connecting to Redis directly');
          client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            username: process.env.REDIS_USERNAME || 'default',
            password: process.env.REDIS_PASSWORD,
            connectTimeout: 30000,
          });
        }

        client.on('ready', () => {
          console.log('✅ Redis client connected and ready');
        });

        client.on('error', (err) => {
          console.error('❌ Redis connection error:', err);
        });

        return client;
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
