// src/modules/order/infrastructure/mappers/order.mapper.ts
import {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
} from '@order-prisma-client';
import { Order, OrderStatus } from '../../domain/model/order.entity';

export class OrderMapper {
  static toDomain(raw: PrismaOrder & { items?: PrismaOrderItem[] }): Order {
    return new Order(
      Number(raw.id),
      raw.userId,
      raw.status as OrderStatus,
      (raw.items ?? []).map((item) => ({
        productId: item.productId,
        productName: item.productName || '',
        productSku: item.productSku || '',
        quantity: item.quantity,
        price: item.price,
      })) as any,
      raw.total as any,
      raw.createdAt,
      raw.updatedAt,
    );
  }
}
