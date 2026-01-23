// src/inventory/inventory.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { RedisService } from '@app/redis';

interface BufferedJob {
  jobId: string;
  data: any;
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}

@Processor('inventory-queue', { concurrency: 50 })
export class InventoryProcessor extends WorkerHost {
  private jobBuffer: BufferedJob[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_TIMEOUT = 50;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prismaInventory: PrismaInventoryService,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.jobBuffer.push({ jobId: job.id, data: job.data, resolve, reject });

      if (this.jobBuffer.length >= this.BATCH_SIZE) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.FLUSH_TIMEOUT);
      }
    });
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.jobBuffer.length === 0) return;

    const batch = [...this.jobBuffer];
    this.jobBuffer = [];

    try {
      const flatLogs = batch.flatMap((b) => {
        const payload = b.data.payload;
        let items = payload.items || [
          {
            productId: payload.productId,
            sku: payload.sku,
            quantity: payload.quantity,
          },
        ];

        return items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          sku: item.sku,
          type: b.data.type === 'RESERVE' ? 'OUTBOUND' : 'INBOUND',
          orderId: payload.orderId,
        }));
      });

      const stockChanges = this.calculateStockChanges(flatLogs);

      const inventoryIds = new Map<string, number>();

      await this.prismaInventory.$transaction(async (tx) => {
        const sortedSkus = Object.keys(stockChanges).sort();

        for (const sku of sortedSkus) {
          const changeAmount = stockChanges[sku];

          const inventory = await tx.inventory.update({
            where: { sku },
            data: { stockQuantity: { increment: changeAmount } },
            select: { id: true },
          });
          inventoryIds.set(sku, inventory.id);
        }

        if (flatLogs.length > 0) {
          await tx.inventoryTransaction.createMany({
            data: flatLogs.map((log) => ({
              inventoryId: inventoryIds.get(log.sku)!,
              type: log.type,
              quantity: log.quantity,
            })),
          });
        }
      });

      batch.forEach((job) => job.resolve({ processed: true }));
    } catch (error) {
      const reserveItemsToRollback = batch
        .filter((b) => b.data.type === 'RESERVE')
        .flatMap((b) => b.data.payload.items);

      // if (reserveItemsToRollback.length > 0) {
      //   await this.redisService.releaseAtomic(reserveItemsToRollback);
      // }

      batch.forEach((job) => job.reject(error));
    }
  }

  private calculateStockChanges(flatLogs: any[]): Record<string, number> {
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
}
