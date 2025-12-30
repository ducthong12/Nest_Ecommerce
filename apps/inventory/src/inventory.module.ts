import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { RedisModule } from '@app/redis';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [RedisModule],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaInventoryService],
})
export class InventoryModule {}
