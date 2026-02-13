import { Module } from '@nestjs/common';
import { OrderService } from './modules/order/application/services/order.service';
import { OrderControllerV1 } from './modules/order/interface/http/order-v1.controller';
import { OrderGrpcController } from './modules/order/interface/grpc/order-grpc.controller';
import { RedisModule } from '@app/redis';
import { SagaReplyConsumer } from './modules/order/interface/kafka/saga-reply.consumer';
import { CqrsModule } from '@nestjs/cqrs';
import { OrderSagas } from './modules/order/application/sagas/order.saga';
import { CheckoutOrderHandler } from './modules/order/application/commands/handlers/checkout-order.handler';
import {
  CancelOrderHandler,
  ProcessPaymentHandler,
  ReserveStockHandler,
} from './modules/order/application/commands/handlers/saga-handlers';
import { PrismaOrderService } from './modules/order/infrastructure/persistence/prisma-order.service';
import { PrismaOrderRepository } from './modules/order/infrastructure/persistence/prisma-order.repository';
import { InventoryRedisService } from './modules/order/infrastructure/redis/inventory-redis.service';
import { OutboxRepository } from './modules/order/infrastructure/persistence/prisma-outbox.repository';

@Module({
  imports: [RedisModule, CqrsModule],
  controllers: [OrderControllerV1, OrderGrpcController, SagaReplyConsumer],
  providers: [
    OrderService,
    OrderSagas,
    CheckoutOrderHandler,
    ReserveStockHandler,
    ProcessPaymentHandler,
    CancelOrderHandler,
    PrismaOrderService,
    PrismaOrderRepository,
    InventoryRedisService,
    OutboxRepository,
  ],
})
export class OrderModule {}
