import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { EventPattern, GrpcMethod } from '@nestjs/microservices';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { ConfirmOrderDto } from 'common/dto/order/confirm-order.dto';
import { KafkaRetry } from '@common/decorators/kafka-retry.decorator';
import { CreateOrderDto } from 'common/dto/order/create-order.dto';
import { UpdateOrderDto } from 'common/dto/order/update-order.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'CreateOrder')
  createOrder(data: CreateOrderDto) {
    return this.orderService.createOrder(data);
  }

  @GrpcMethod('OrderService', 'UpdateOrder')
  updateOrder(data: UpdateOrderDto) {
    return this.orderService.updateOrder(data);
  }

  @GrpcMethod('OrderService', 'OrderCheckout')
  orderCheckout(data: OrderCheckoutDto) {
    return this.orderService.orderCheckout(data);
  }

  @GrpcMethod('OrderService', 'GetOrderById')
  getOrderById(data: { id: number }) {
    return this.orderService.getOrderById(data.id);
  }

  @GrpcMethod('OrderService', 'GetOrderDraft')
  getOrderDraft() {
    return this.orderService.getOrderDraft();
  }

  @GrpcMethod('OrderService', 'SyncOrder')
  syncOrder(data: UpdateOrderDto | CreateOrderDto) {
    return this.orderService.syncOrder(data);
  }

  @EventPattern('payment.successed')
  // @KafkaRetry({
  //   maxRetries: 2,
  //   dltTopic: 'order.confirm.dlt',
  //   clientToken: 'ORDER_KAFKA_CLIENT',
  // })
  handlePaymentSuccessed(data: ConfirmOrderDto) {
    return this.orderService.processPaymentSuccessed(data);
  }

  @EventPattern('payment.canceled')
  // @KafkaRetry({
  //   maxRetries: 2,
  //   dltTopic: 'order.cancel.dlt',
  //   clientToken: 'ORDER_KAFKA_CLIENT',
  // })
  handlePaymentCanceled(data: CancelOrderDto) {
    return this.orderService.processPaymentCanceled(data);
  }
}
