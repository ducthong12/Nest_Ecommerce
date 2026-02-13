import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

interface ReserveResult {
  success: boolean;
  failedProductIds: string[];
}

interface InventoryRedis {
  sku: string;
  quantity: number;
}

@Injectable()
export class InventoryRedisService {
  private readonly RESERVE_STOCK_SCRIPT = `
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
  `;

  private readonly RELEASE_STOCK_SCRIPT = `
    if redis.call("EXISTS", KEYS[1]) == 1 then
      return 0 -- Đã xử lý rồi, trả về 0
    end

    for i = 2, #ARGV, 2 do
      local key = ARGV[i]
      local qty = tonumber(ARGV[i+1])
      redis.call("INCRBY", key, qty)
    end

    redis.call("SET", KEYS[1], "1", "EX", ARGV[1])

    return 1
  `;

  private readonly ADD_STOCK_SCRIPT = `
    for i = 1, #ARGV, 2 do
      local key = ARGV[i]
      local qty = tonumber(ARGV[i+1])
      redis.call('INCRBY', key, qty)
    end
    return 1
  `;

  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async reserveStock(items: InventoryRedis[]): Promise<ReserveResult> {
    if (items.length === 0) return { success: true, failedProductIds: [] };

    const args = [] as (string | number)[];
    for (const item of items) {
      args.push(`inventory:product:${item.sku}`);
      args.push(item.quantity);
    }

    if (!this.redisClient) {
      throw new Error('Redis client not initialized');
    }

    try {
      const result = await this.redisClient.eval(
        this.RESERVE_STOCK_SCRIPT,
        0,
        ...args,
      );
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

  async releaseStock(
    items: InventoryRedis[],
    orderId: string,
  ): Promise<boolean> {
    const idempotencyKey = `inventory:processed:${orderId}`;
    const ttl = 3600;

    const args: (string | number)[] = [ttl];

    items.forEach((item) => {
      const stockKey = `inventory:product:${item.sku}`;
      args.push(stockKey, item.quantity);
    });

    const result = await this.redisClient.eval(
      this.RELEASE_STOCK_SCRIPT,
      1,
      idempotencyKey,
      ...args,
    );

    return result === 1;
  }

  async setStock(items: InventoryRedis): Promise<void> {
    if (!items) return;

    if (!this.redisClient) {
      throw new Error('Redis client not initialized');
    }

    const args = [] as (string | number)[];
    args.push(`inventory:product:${items.sku}`);
    args.push(items.quantity);

    try {
      await this.redisClient.eval(this.ADD_STOCK_SCRIPT, 0, ...args);
    } catch (error) {
      throw new Error('Redis Add Stock Failed');
    }
  }

  async getStock(sku: string): Promise<number> {
    const key = `inventory:product:${sku}`;
    const stockStr = await this.redisClient.get(key);
    return stockStr ? parseInt(stockStr, 10) : 0;
  }

  async acquireLock(userId: number, lockUuid: string): Promise<boolean> {
    const lockKey = `lock:checkout:user:${userId}`;
    // Lưu lockUuid vào Redis thay vì chữ 'locked'
    const result = await this.redisClient.set(lockKey, lockUuid, 'EX', 5, 'NX');
    return result === 'OK';
  }

  async releaseLock(userId: number, lockUuid: string): Promise<void> {
    const lockKey = `lock:checkout:user:${userId}`;

    // Kịch bản Lua: "Nếu value của key bằng với UUID của tao thì tao mới xóa"
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.redisClient.eval(script, 1, lockKey, lockUuid);
  }
}
