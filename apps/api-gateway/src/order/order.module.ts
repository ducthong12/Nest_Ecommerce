import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderControllerV1, OrderControllerV2 } from './order.controller';

@Module({
  controllers: [OrderControllerV1, OrderControllerV2],
  providers: [OrderService],
})
export class OrderModule {}
