import { Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { StorageModule } from './storage/storage.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { RateLimitGuard } from '@common/guards/rate-limit.guard';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrderModule } from './order/order.module';
import { SearchModule } from './search/search.module';
import { PaymentModule } from './payment/payment.module';
import { GrpcClientsModule } from './common/module/grpc-clients.module';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health/health.controller';
import { MetricsController } from '../metrics/metrics.controller';

@Module({
  imports: [
    TerminusModule,
    PrometheusModule.register({
      controller: MetricsController,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 50,
      },
    ]),
    GrpcClientsModule,
    UserModule,
    ProductModule,
    InventoryModule,
    OrderModule,
    SearchModule,
    PaymentModule,
    StorageModule,
  ],
  controllers: [ApiGatewayController, HealthController],
  providers: [
    ApiGatewayService,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class ApiGatewayModule {}
