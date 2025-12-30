import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { EventPattern, GrpcMethod } from '@nestjs/microservices';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'CreateOrder')
  createOrder(data: ReserveStockDto) {
    return this.orderService.createOrder(data);
  }

  @EventPattern('order.cancel')
  cancelOrder(data: CancelOrderDto) {
    return this.orderService.cancelOrder(data);
  }
}
