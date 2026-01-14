import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from 'common/dto/payment/create-payment.dto';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { PaymentSuccessDto } from 'common/dto/payment/payment-success.dto';
import { PaymentCancelDto } from 'common/dto/payment/cancel-payment.dto';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern('payment.init')
  async createPayment(
    @Payload() message: CreatePaymentDto,
    @Ctx() context: KafkaContext,
  ) {
    const result = await this.paymentService.createPayment(message);
    return result;
  }

  @EventPattern('payment.success')
  async paymentSuccess(
    @Payload() message: PaymentSuccessDto,
    @Ctx() context: KafkaContext,
  ) {
    const result = await this.paymentService.paymentSuccess(message);
    return result;
  }

  @EventPattern('payment.cancel')
  async paymentCancel(
    @Payload() message: PaymentCancelDto,
    @Ctx() context: KafkaContext,
  ) {
    const result = await this.paymentService.paymentCancel(message);
    return result;
  }

  @EventPattern('payment.failed')
  async paymentFailed(
    @Payload() message: CreatePaymentDto,
    @Ctx() context: KafkaContext,
  ) {
    const result = await this.paymentService.createPayment(message);
    return result;
  }
}
