import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@generated/order-service';

@Injectable()
export class PrismaOrderService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
