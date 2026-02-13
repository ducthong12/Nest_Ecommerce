import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@order-prisma-client';

@Injectable()
export class PrismaOrderService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({});
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
