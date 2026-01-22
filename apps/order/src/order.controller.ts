import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { EventPattern, GrpcMethod } from '@nestjs/microservices';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { ConfirmOrderDto } from 'common/dto/order/confirm-order.dto';
import { KafkaRetry } from '@common/decorators/kafka-retry.decorator';

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
