import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Order } from '../../../domain/model/order.entity';
import { PrismaOrderService } from '../../../infrastructure/persistence/prisma-order.service';
import { OrderCheckoutedEvent } from '../../events/impl/saga-event';
import { CheckoutOrderCommand } from '../impl/checkout-order.command';
import { PrismaOrderRepository } from '../../../infrastructure/persistence/prisma-order.repository';
import { InventoryRedisService } from '../../../infrastructure/redis/inventory-redis.service';
import { uuid } from 'uuidv4';

@CommandHandler(CheckoutOrderCommand)
export class CheckoutOrderHandler implements ICommandHandler<CheckoutOrderCommand> {
  constructor(
    private readonly prisma: PrismaOrderService,
    private readonly orderRepo: PrismaOrderRepository,
    private readonly inventoryRedis: InventoryRedisService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CheckoutOrderCommand): Promise<Order> {
    const { userId, items } = command;
    const lockUuid = uuid();

    // ==========================================
    // 0. LẤY KHÓA (DISTRIBUTED LOCK)
    // ==========================================
    const isLocked = await this.inventoryRedis.acquireLock(userId, lockUuid);
    if (!isLocked) {
      // Bị chặn ngay lập tức nếu user đang có 1 luồng checkout khác chạy dở
      throw new Error(
        'Bạn đang thao tác quá nhanh. Vui lòng chờ trong giây lát!',
      );
    }

    try {
      // ==========================================
      // 1. TRỪ KHO REDIS (Pre-decrement)
      // ==========================================
      const result = await this.inventoryRedis.reserveStock(items);
      if (!result.success) {
        throw new Error(
          `Sản phẩm đã hết hàng: ${result.failedProductIds.join(', ')}`,
        );
      }

      let executedOrder: Order;

      try {
        // ==========================================
        // 2. TRANSACTION DATABASE
        // ==========================================
        executedOrder = await this.prisma.$transaction(async (tx) => {
          const orderEntity = await this.orderRepo.findDraftByUserId(
            userId,
            tx,
          );

          if (!orderEntity || !orderEntity.id) {
            throw new Error('Draft order not found'); // Lúc này nếu văng lỗi sẽ rất mượt
          }

          orderEntity.checkout();

          if (!orderEntity || !orderEntity.id) {
            throw new Error('Order status update failed');
          }

          await this.orderRepo.update(orderEntity, tx);

          return orderEntity;
        });
      } catch (dbError) {
        // 3. ROLLBACK REDIS
        console.error(`[Checkout] DB Error. Rolling back Redis...`);
        await this.inventoryRedis.releaseStock(items, lockUuid);
        throw dbError;
      }

      // 4. PUBLISH EVENT
      this.eventBus.publish(
        new OrderCheckoutedEvent(
          Number(executedOrder.id),
          userId,
          executedOrder.items,
          executedOrder.total,
        ),
      );

      return executedOrder;
    } finally {
      // ==========================================
      // 5. GIẢI PHÓNG KHÓA
      // ==========================================
      // Luôn luôn phải mở khóa, dù code chạy thành công hay văng lỗi (catch)
      await this.inventoryRedis.releaseLock(userId, lockUuid);
    }
  }
}
