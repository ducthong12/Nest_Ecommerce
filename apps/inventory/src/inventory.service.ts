// src/inventory/inventory.service.ts
import { RedisService } from '@app/redis/redis.service';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { RestockProductDto } from 'common/dto/restock/restock-product.dto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prismaInventory: PrismaInventoryService,
    // @Inject('INVENTORY_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka, // Inject Kafka Producer
  ) {}

  /**
   * 1. SHOP NHẬP HÀNG THÊM (RESTOCK)
   * Yêu cầu: Đang sale thì shop tăng sản phẩm -> Cập nhật ngay.
   */
  async restockProduct(data: RestockProductDto) {
    // B1: Update Database (Postgres) để lưu trữ bền vững
    // Sử dụng upsert: Nếu chưa có thì tạo mới, có rồi thì cộng thêm
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

    // B2: Update Redis (Cache) để phục vụ bán hàng ngay lập tức
    await this.redisService.addStockAtomic(data.productId, data.quantity);

    // B3: Bắn Event (Optional - để các service khác như Search cập nhật lại index)
    // this.kafkaClient.emit('inventory.restocked', { productId, quantity });

    return result;
  }

  /**
   * 2. KHÁCH MUA HÀNG (RESERVE)
   * Yêu cầu: 100 sản phẩm chỉ cho 100 người.
   */
  async reserveProduct(
    orderId: number,
    items: { productId: string; quantity: number }[],
  ) {
    // Duyệt qua từng sản phẩm để trừ kho trên Redis
    for (const item of items) {
      // BƯỚC QUAN TRỌNG: Gọi Lua Script
      const isSuccess = await this.redisService.reserveStockAtomic(
        item.productId,
        item.quantity,
      );

      if (!isSuccess) {
        // Nếu thất bại (Hết hàng) -> Throw lỗi ngay để Controller trả về Client
        throw new BadRequestException(
          `Product ${item.productId} is out of stock.`,
        );
      }
    }

    // Nếu tất cả sản phẩm đều trừ Redis thành công:
    // Bắn message vào Kafka để cập nhật DB sau (Async)
    // this.kafkaClient.emit('inventory.sold', {
    //   orderId,
    //   items,
    // });

    return { success: true };
  }
}
