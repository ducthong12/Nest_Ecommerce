import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@generated/inventory-service';

@Injectable()
export class PrismaInventoryService
  extends PrismaClient
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
  }
}
