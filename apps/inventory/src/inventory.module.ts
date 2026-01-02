import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { RedisModule } from '@app/redis';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

@Module({
  imports: [
    RedisModule,
    ClientsModule.register([
      {
        name: 'INVENTORY_KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'inventory-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          producer: {
            allowAutoTopicCreation: true,
            idempotent: true, // NÊN BẬT: Đảm bảo tin nhắn không bị gửi trùng (Exactly-once)
            createPartitioner: Partitioners.LegacyPartitioner,
          },
        },
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaInventoryService],
})
export class InventoryModule {}
