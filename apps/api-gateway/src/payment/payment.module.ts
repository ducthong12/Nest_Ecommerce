import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentControllerV1 } from './payment.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentControllerV1],
  providers: [PaymentService],
})
export class PaymentModule {}
