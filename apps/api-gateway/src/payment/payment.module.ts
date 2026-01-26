import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentControllerV1 } from './payment.controller';

@Module({
  controllers: [PaymentControllerV1],
  providers: [PaymentService],
})
export class PaymentModule {}
