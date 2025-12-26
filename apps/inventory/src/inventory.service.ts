// src/inventory/inventory.service.ts
import { RedisService } from '@app/redis/redis.service';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { RestockStockDto } from 'common/dto/inventory/restock-stock.dto';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { ReleaseStockDto } from 'common/dto/inventory/release-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaInventory: PrismaInventoryService,
    // @Inject('INVENTORY_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka, // Inject Kafka Producer
  ) {}

  async restockStock(data: RestockStockDto) {
    console.log('Restocking stock:', data);
    const result = await this.prismaInventory.inventory.upsert({
      where: { productId: data.productId },
      update: { stockQuantity: { increment: data.quantity } },
      create: {
        productId: data.productId,
        stockQuantity: data.quantity,
        reservedStock: 0,
        sku: data.sku,
      },
    });

    await this.redisService.addStockAtomic({
      productId: data.productId,
      quantity: data.quantity,
    });

    // this.kafkaClient.emit('inventory.restocked', { productId, quantity });

    return result;
  }

  async reserveStock(data: ReserveStockDto) {
    try {
      const { success, failedProductIds } =
        await this.redisService.reserveAtomic(data.items);

      if (!success) {
        return { success: false, failedProductIds };
      }

      // this.kafkaClient.emit('inventory.sold', {
      //   orderId,
      //   items,
      // });

      return { success: true, failedProductIds };
    } catch (error) {
      await this.releaseStock({ orderId: data.orderId, items: data.items });
      return { success: false, failedProductIds: [] };
    }
  }

  async releaseStock(data: ReleaseStockDto) {
    await this.redisService.releaseAtomic(data.items);
    // this.kafkaClient.emit('inventory.log', {
    //   type: 'RELEASED',
    //   orderId,
    //   items,
    // });

    return { success: true };
  }
}
