// src/inventory/inventory.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { RestockInventoryDto } from 'common/dto/inventory/restock-stock.dto';
import { ReserveStockInventoryDto } from 'common/dto/inventory/reverse-stock.dto';
import { RedisService } from '@app/redis';
import { OrderCanceledEvent } from 'common/dto/order/order-canceled.event';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaInventory: PrismaInventoryService,
  ) {}

  async restockInventory(data: RestockInventoryDto) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async reserveStockInventory(data: ReserveStockInventoryDto) {
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
      });

      return { success: true, failedProductIds };
    } catch (error) {
      throw error;
    }
  }

  async processOrderCheckoutFailed(data: OrderCheckoutDto & { id: string }) {
    const success = await this.redisService.releaseAtomic(data.items, data.id);

    if (!success) {
      return { success: false };
    }

    try {
      await this.prismaInventory.$transaction(async (tx) => {
        for (const item of data.items) {
          await tx.inventory.update({
            where: { sku: item.sku },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async redisAddStock(data: { sku: string; quantity: number }) {
    try {
      await this.redisService.addStockAtomic({
        sku: data.sku,
        quantity: data.quantity,
      });
    } catch (error) {
      throw error;
    }
  }

  async processOrderCanceled(data: OrderCanceledEvent) {
    if (!data.items || data.items.length === 0) {
      return { success: true };
    }

    try {
      await this.redisService.releaseAtomic(data.items, data.id);
    } catch (error) {
      throw error;
    }

    try {
      await this.prismaInventory.$transaction(async (tx) => {
        for (const item of data.items) {
          await tx.inventory.update({
            where: { sku: item.sku },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}
