import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { EventPattern, GrpcMethod } from '@nestjs/microservices';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { ConfirmOrderDto } from 'common/dto/order/confirm-order.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'CreateOrder')
  createOrder(data: OrderCheckoutDto) {
    return this.orderService.createOrder(data);
  }

  @GrpcMethod('OrderService', 'GetOrder')
  getOrder(data: { id: number }) {
    return this.orderService.getOrder(data.id);
  }

  @EventPattern('order.confirm')
  confirmOrder(data: ConfirmOrderDto) {
    return this.orderService.confirmOrder(data);
  }

  @EventPattern('order.cancel')
  cancelOrder(data: CancelOrderDto) {
    return this.orderService.cancelOrder(data);
  }
}
