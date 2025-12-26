import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { RedisModule } from '@app/redis';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [RedisModule],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaInventoryService],
})
export class InventoryModule {}
