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
import { OrderCreatedEvent } from 'common/dto/order/order-created.event';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('order.created')
  async handleOrderCreated(
    @Payload() message: OrderCreatedEvent,
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
