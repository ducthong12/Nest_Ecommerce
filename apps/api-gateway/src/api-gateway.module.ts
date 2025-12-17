import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { StorageModule } from './storage/storage.module';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from 'common/guards/rate-limit.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    StorageModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    UserModule,
  ],
  controllers: [ApiGatewayController],
  providers: [
    ApiGatewayService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class ApiGatewayModule {}
