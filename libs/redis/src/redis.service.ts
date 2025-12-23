import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private reserveStockScript: string;

  onModuleInit() {
    this.redisClient = new Redis({ host: process.env.REDIS_HOST, port: 6379 });

    // Load file Lua Script vào bộ nhớ
    this.reserveStockScript = fs.readFileSync(
      path.join(__dirname, '/scripts/reserve_stock.lua'),
      'utf8',
    );
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

    // eval(script, số lượng key, tên key, tham số quantity)
    const result = await this.redisClient.eval(
      this.reserveStockScript,
      1,
      key,
      quantity,
    );

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
