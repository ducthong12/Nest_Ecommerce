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
    // Use debounceTime to wait for events to stop arriving, then process
    // OR use bufferCount to trigger on X items, whichever comes first
    this.subscription = merge(
      this.logSubject.pipe(bufferTime(500)),
      this.logSubject.pipe(bufferCount(100)),
    )
      .pipe(
        filter((events) => {
          return events.length > 0; // Only process non-empty buffers
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
    // BƯỚC 1: FLATTEN (Làm phẳng dữ liệu)
    // Biến đổi từ: [ {orderId: 1, items: [A, B]}, {orderId: 2, items: [A]} ]
    // Thành: [ {id: A, order: 1}, {id: B, order: 1}, {id: A, order: 2} ]
    const flatLogs: FlatInventoryLog[] = events.flatMap((event) =>
      event.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        type: event.type, // Thừa kế type từ event cha
        orderId: event.orderId,
      })),
    );

    // BƯỚC 2: Tính toán Delta (+/-) dựa trên list đã phẳng
    const stockChanges = this.calculateStockChanges(flatLogs);

    // BƯỚC 3: Transaction DB
    const inventoryIds = new Map<string, number>();
    await this.prismaInventory.$transaction(async (tx) => {
      // Update tồn kho
      for (const [productId, changeAmount] of Object.entries(stockChanges)) {
        const inventory = await tx.inventory.update({
          where: { productId },
          data: { stockQuantity: { increment: changeAmount } },
        });
        inventoryIds.set(productId, inventory.id);
      }

      // Insert Log (Dùng flatLogs để insert từng dòng chi tiết)
      await tx.inventoryTransaction.createMany({
        data: flatLogs.map((log) => ({
          inventoryId: inventoryIds.get(log.productId)!,
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
        const key = log.productId;
        if (!acc[key]) acc[key] = 0;

        // Quy ước dấu
        if (log.type === 'OUTBOUND') {
          acc[key] -= log.quantity;
        } else {
          // RELEASE, RESERVE, INBOUND...
          acc[key] += log.quantity;
        }

        return acc;
      },
      {} as Record<string, number>,
    );
  }

  async restockStock(data: RestockStockDto) {
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
