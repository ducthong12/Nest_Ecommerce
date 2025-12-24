import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  onModuleInit() {
    this.redisClient = new Redis({ host: process.env.REDIS_HOST, port: 6379 });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  /**
   * SỬ DỤNG LUA SCRIPT ĐỂ GIỮ HÀNG
   * Thao tác này là ATOMIC - 1000 request cùng lúc cũng sẽ xếp hàng xử lý từng cái
   */
  async reserveStockAtomic(
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    const key = `inventory:product:${productId}`;

    const luaScript = `
      -- KEYS[1]: Key chứa số lượng tồn kho (VD: inventory:product:123)
      -- ARGV[1]: Số lượng muốn mua (VD: 1)

      local currentStock = tonumber(redis.call('GET', KEYS[1]))

      -- Nếu key chưa tồn tại hoặc bằng 0 -> Hết hàng
      if currentStock == nil or currentStock < tonumber(ARGV[1]) then
          return -1 -- Mã lỗi: Hết hàng
      end

      -- Nếu còn hàng -> Trừ kho ngay lập tức
      redis.call('DECRBY', KEYS[1], ARGV[1])

      -- Trả về số lượng còn lại sau khi trừ
      return redis.call('GET', KEYS[1])
    `;

    // eval(script, số lượng key, tên key, tham số quantity)
    const result = await this.redisClient.eval(luaScript, 1, key, quantity);

    // Lua trả về -1 là hết hàng
    if (result === -1) {
      return false;
    }
    return true; // Thành công (Số lượng đã bị trừ trong Redis)
  }

  /**
   * XỬ LÝ SHOP TĂNG SẢN PHẨM (Restock)
   * Dùng INCRBY để cộng dồn an toàn
   */
  async addStockAtomic(productId: string, quantity: number) {
    const key = `inventory:product:${productId}`;
    await this.redisClient.incrby(key, quantity);
  }

  /**
   * Khởi tạo kho hàng lên Redis (Sync từ DB lên khi khởi động)
   */
  async setStock(productId: string, quantity: number) {
    const key = `inventory:product:${productId}`;
    await this.redisClient.set(key, quantity);
  }
}
