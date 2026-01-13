// src/inventory/inventory.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { RestockStockDto } from 'common/dto/inventory/restock-stock.dto';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { ReleaseStockDto } from 'common/dto/inventory/release-stock.dto';
import {
  bufferTime,
  filter,
  Subject,
  Subscription,
  merge,
  bufferCount,
} from 'rxjs';
import {
  FlatInventoryLog,
  InventoryEventDto,
} from 'common/dto/inventory/inventory-log.dto';
import { RedisService } from '@app/redis';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class InventoryService {
  private logSubject = new Subject<any>();
  private subscription: Subscription;

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaInventory: PrismaInventoryService,
    @Inject('INVENTORY_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  onModuleInit() {
    this.subscription = merge(
      this.logSubject.pipe(bufferTime(500)),
      this.logSubject.pipe(bufferCount(100)),
    )
      .pipe(
        filter((events) => {
          return events.length > 0;
        }),
      )
      .subscribe(async (batchEvents: InventoryEventDto[]) => {
        await this.processBatch(batchEvents);
      });
  }

  onModuleDestroy() {
    this.subscription.unsubscribe();
  }

  async addToBuffer(message: InventoryEventDto) {
    this.logSubject.next(message);
  }

  private async processBatch(events: InventoryEventDto[]) {
    const flatLogs: FlatInventoryLog[] = events.flatMap((event) =>
      event.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        type: event.type, // Thừa kế type từ event cha
        orderId: event.orderId,
        sku: item.sku,
      })),
    );

    const stockChanges = this.calculateStockChanges(flatLogs);

    const inventoryIds = new Map<string, number>();
    await this.prismaInventory.$transaction(async (tx) => {
      for (const [sku, changeAmount] of Object.entries(stockChanges)) {
        const inventory = await tx.inventory.update({
          where: { sku },
          data: { stockQuantity: { increment: changeAmount } },
        });
        inventoryIds.set(sku, inventory.id);
      }

      await tx.inventoryTransaction.createMany({
        data: flatLogs.map((log) => ({
          inventoryId: inventoryIds.get(log.sku)!,
          type: log.type,
          quantity: log.quantity,
        })),
      });
    });
  }

  private calculateStockChanges(
    flatLogs: FlatInventoryLog[],
  ): Record<string, number> {
    return flatLogs.reduce(
      (acc, log) => {
        const key = log.sku;
        if (!acc[key]) acc[key] = 0;

        if (log.type === 'OUTBOUND') {
          acc[key] -= log.quantity;
        } else {
          acc[key] += log.quantity;
        }

        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async restockStock(data: RestockStockDto) {
    const result = await this.prismaInventory.inventory.upsert({
      where: { sku: data.sku },
      update: { stockQuantity: { increment: data.quantity } },
      create: {
        productId: data.productId,
        stockQuantity: data.quantity,
        reservedStock: 0,
        sku: data.sku,
      },
    });

    await this.redisService.addStockAtomic({
      sku: data.sku,
      quantity: data.quantity,
    });

    this.kafkaClient.emit('product.restock', data);

    return result;
  }

  async reserveStock(data: ReserveStockDto) {
    try {
      const { success, failedProductIds } =
        await this.redisService.reserveAtomic(data.items);

      if (!success) {
        return { success: false, failedProductIds };
      }

      for (const item of data.items) {
        this.kafkaClient.emit('product.reserve', item);
      }

      return { success: true, failedProductIds };
    } catch (error) {
      await this.releaseStock({ orderId: data.orderId, items: data.items });
      return { success: false, failedProductIds: [] };
    }
  }

  async releaseStock(data: ReleaseStockDto) {
    await this.redisService.releaseAtomic(data.items);

    this.kafkaClient.emit(
      'inventory.log',
      JSON.stringify({
        type: 'RELEASE',
        orderId: data.orderId.toString(),
        items: data.items,
      }),
    );
    return { success: true };
  }
}
