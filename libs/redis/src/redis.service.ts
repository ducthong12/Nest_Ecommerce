import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface ReserveResult {
  success: boolean;
  failedProductIds: string[]; // Danh sách ID bị hết hàng
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  onModuleInit() {
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
    });

    this.registerScripts();
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  private registerScripts() {
    this.redisClient.defineCommand('reserveStock', {
      numberOfKeys: 0,
      lua: `
        local failedKeys = {}
        local failedCount = 0

        -- BƯỚC 1: KIỂM TRA (CHECK PHASE)
        for i = 1, #ARGV, 2 do
          local key = ARGV[i]
          local qty = tonumber(ARGV[i+1])
          local currentStock = tonumber(redis.call('GET', key) or 0)

          if currentStock < qty then
              failedCount = failedCount + 1
              failedKeys[failedCount] = key -- Lưu key bị lỗi vào mảng
          end
        end

        -- Nếu có bất kỳ món nào lỗi -> Trả về danh sách key lỗi ngay
        if failedCount > 0 then
          return failedKeys
        end

        -- BƯỚC 2: TRỪ KHO (COMMIT PHASE)
        -- Chỉ chạy khi tất cả đều đủ hàng
        for i = 1, #ARGV, 2 do
          local key = ARGV[i]
          local qty = tonumber(ARGV[i+1])
          redis.call('DECRBY', key, qty)
        end

        return nil -- Trả về nil nghĩa là thành công
      `,
    });

    this.redisClient.defineCommand('releaseStock', {
      numberOfKeys: 0,
      lua: `
        for i = 1, #ARGV, 2 do
          local key = ARGV[i]
          local qty = tonumber(ARGV[i+1])
          redis.call('INCRBY', key, qty)
        end
        return 1
      `,
    });

    this.redisClient.defineCommand('addStock', {
      numberOfKeys: 0,
      lua: `
        for i = 1, #ARGV, 2 do
          local key = ARGV[i]
          local qty = tonumber(ARGV[i+1])
          redis.call('INCRBY', key, qty)
        end
        return 1
      `,
    });
  }

  async reserveAtomic(
    items: { productId: string; quantity: number }[],
  ): Promise<ReserveResult> {
    if (items.length === 0) return { success: true, failedProductIds: [] };

    const args = [];
    for (const item of items) {
      args.push(`inventory:product:${item.productId}`);
      args.push(item.quantity);
    }

    try {
      // @ts-ignore
      const result = await this.redisClient.reserveStock(...args);
      if (!result) {
        return { success: true, failedProductIds: [] };
      }

      const failedKeys = result as string[];
      const failedIds = failedKeys.map((key) =>
        key.replace('inventory:product:', ''),
      );

      return { success: false, failedProductIds: failedIds };
    } catch (error) {
      throw new Error('Redis Internal Error');
    }
  }

  async releaseAtomic(
    items: { productId: string; quantity: number }[],
  ): Promise<void> {
    if (items.length === 0) return;

    const args = [];
    for (const item of items) {
      args.push(`inventory:product:${item.productId}`);
      args.push(item.quantity);
    }

    try {
      // @ts-ignore
      await this.redisClient.releaseStock(...args);
    } catch (error) {
      console.error('Redis Release Error:', error);
    }
  }

  async addStockAtomic(items: {
    productId: string;
    quantity: number;
  }): Promise<void> {
    if (!items) return;

    const args = [];
    args.push(`inventory:product:${items.productId}`);
    args.push(items.quantity);

    try {
      // @ts-ignore
      await this.redisClient.addStock(...args);
    } catch (error) {
      throw new Error('Redis Add Stock Failed');
    }
  }
}
