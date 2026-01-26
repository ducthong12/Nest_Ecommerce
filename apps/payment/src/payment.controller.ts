import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  Ctx,
  EventPattern,
  GrpcMethod,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { PaymentSuccessDto } from 'common/dto/payment/payment-success.dto';
import { PaymentCancelDto } from 'common/dto/payment/cancel-payment.dto';
import { OrderCheckoutEvent } from 'common/dto/order/order-checkout.event';
import { PrismaPaymentService } from '../prisma/prisma-payment.service';
import { KafkaRetry } from '@common/decorators/kafka-retry.decorator';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('order.checkout')
  @KafkaRetry({
    maxRetries: 2,
    dltTopic: 'payment.order.checkout.failed',
    clientToken: 'PAYMENT_KAFKA_CLIENT',
    dbToken: PrismaPaymentService,
  })
  async handleOrderCheckout(
    @Payload() message: OrderCheckoutEvent,
    @Ctx() context: KafkaContext,
  ) {
    return await this.paymentService.processPaymentForOrder(message);
  }

  @GrpcMethod('PaymentService', 'PaymentSuccessed')
  async paymentSuccessed(
    @Payload() message: PaymentSuccessDto,
    @Ctx() context: KafkaContext,
  ) {
    return await this.paymentService.processPaymentSuccessed(message);
  }

  @GrpcMethod('PaymentService', 'PaymentCanceled')
  async paymentCanceled(
    @Payload() message: PaymentCancelDto,
    @Ctx() context: KafkaContext,
  ) {
    const result = await this.paymentService.processPaymentCanceled(message);
    return result;
  }
}
