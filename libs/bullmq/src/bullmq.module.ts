import { Module } from '@nestjs/common';
import { BullmqService } from './bullmq.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT') || 6379,
          username: config.get('REDIS_USER'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),
  ],
  providers: [BullmqService],
  exports: [BullmqService],
})
export class BullmqModule {}
