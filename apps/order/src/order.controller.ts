import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { EventPattern, GrpcMethod } from '@nestjs/microservices';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { ConfirmOrderDto } from 'common/dto/order/confirm-order.dto';
import { KafkaRetry } from '@common/decorators/kafka-retry.decorator';
import { CreateOrderDto } from 'common/dto/order/create-order.dto';
import { UpdateOrderDto } from 'common/dto/order/update-order.dto';
import { PrismaOrderService } from '../prisma/prisma-order.service';
import { OrderCheckoutEvent } from 'common/dto/order/order-checkout.event';

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
  @KafkaRetry({
    maxRetries: 2,
    dltTopic: 'order.payment.successed.failed',
    clientToken: 'ORDER_KAFKA_CLIENT',
    dbToken: PrismaOrderService,
  })
  handlePaymentSuccessed(data: ConfirmOrderDto) {
    return this.orderService.processPaymentSuccessed(data);
  }

  @EventPattern('payment.canceled')
  @KafkaRetry({
    maxRetries: 2,
    dltTopic: 'order.payment.canceled.failed',
    clientToken: 'ORDER_KAFKA_CLIENT',
    dbToken: PrismaOrderService,
  })
  handlePaymentCanceled(data: CancelOrderDto) {
    return this.orderService.processPaymentCanceled(data);
  }

  @EventPattern('payment.order.checkout.failed')
  @KafkaRetry({
    maxRetries: 2,
    dltTopic: 'order.payment.order.checkout.failed.dlt',
    clientToken: 'ORDER_KAFKA_CLIENT',
    dbToken: PrismaOrderService,
  })
  handlePaymentOrderCheckoutFailed(data: OrderCheckoutEvent) {
    return this.orderService.processPaymentOrderCheckoutFailed(data);
  }
}
