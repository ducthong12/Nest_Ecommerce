import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@inventory-prisma-client';

@Injectable()
export class PrismaInventoryService
  extends PrismaClient
  implements OnModuleInit
{
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
