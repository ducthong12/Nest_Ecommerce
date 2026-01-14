import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentSuccessDto } from 'common/dto/payment/payment-success.dto';
import { PaymentByCashDto } from 'common/dto/payment/payment-cash.dto';
import { PaymentCancelDto } from 'common/dto/payment/cancel-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('success')
  async paymentSuccess(@Body() payment: PaymentSuccessDto) {
    return await this.paymentService.paymentSuccess(payment);
  }

  @Post('cash')
  async paymentByCash(@Body() payment: PaymentByCashDto) {
    return await this.paymentService.paymentByCash(payment);
  }

  @Post('cancel')
  async paymentCancel(@Body() payment: PaymentCancelDto) {
    return await this.paymentService.paymentCancel(payment);
  }
}
