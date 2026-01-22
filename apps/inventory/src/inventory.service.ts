// src/inventory/inventory.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { RestockStockDto } from 'common/dto/inventory/restock-stock.dto';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { ReleaseStockDto } from 'common/dto/inventory/release-stock.dto';
import { RedisService } from '@app/redis';

@Injectable()
export class InventoryService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaInventory: PrismaInventoryService,
  ) {}

  async restockStock(data: RestockStockDto) {
    const result = await this.prismaInventory.$transaction(async (tx) => {
      const inventory = await this.prismaInventory.inventory.upsert({
        where: { sku: data.sku },
        update: { stockQuantity: { increment: data.quantity } },
        create: {
          productId: data.productId,
          stockQuantity: data.quantity,
          reservedStock: 0,
          sku: data.sku,
        },
      });

      const outboxEvents = [
        {
          topic: 'product.restock',
          payload: data,
        },
        {
          topic: 'redis.addstock',
          payload: {
            sku: data.sku,
            quantity: data.quantity,
          },
        },
      ];

      await tx.outbox.createMany({
        data: outboxEvents.map((event) => ({
          topic: event.topic,
          payload: event.payload as any,
          status: 'PENDING',
        })),
      });

      return inventory;
    });

    return result;
  }

  async reserveStock(data: ReserveStockDto) {
    const { success, failedProductIds } = await this.redisService.reserveAtomic(
      data.items,
    );

    if (!success) {
      return { success: false, failedProductIds };
    }

    try {
      await this.prismaInventory.$transaction(async (tx) => {
        for (const item of data.items) {
          await tx.inventory.update({
            where: { sku: item.sku },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }

        const outboxEvents = data.items.map((item) => ({
          topic: 'product.reserve',
          payload: item,
          status: 'PENDING',
        }));

        await this.prismaInventory.$transaction(async (tx) => {
          await tx.outbox.createMany({
            data: outboxEvents as any,
          });
        });
      });

      return { success: true, failedProductIds };
    } catch (error) {
      await this.redisService.releaseAtomic(data.items);
      return { success: false, failedProductIds: [] };
    }
  }

  async releaseStock(data: ReleaseStockDto) {
    await this.redisService.releaseAtomic(data.items);

    await this.prismaInventory.$transaction(async (tx) => {
      for (const item of data.items) {
        await tx.inventory.update({
          where: { sku: item.sku },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    });

    return { success: true };
  }

  async redisAddStock(data: { sku: string; quantity: number }) {
    await this.redisService.addStockAtomic({
      sku: data.sku,
      quantity: data.quantity,
    });
  }
}
