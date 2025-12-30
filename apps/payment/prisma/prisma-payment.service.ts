import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@generated/payment-service';

@Injectable()
export class PrismaPaymentService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
