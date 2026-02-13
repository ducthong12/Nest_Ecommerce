import { Prisma } from '@prisma/client';
import { Order, OrderStatus } from '../model/order.entity';

export interface IOrderRepository {
  create(order: Order, tx?: Prisma.TransactionClient): Promise<Order>;
  update(order: Order, tx?: Prisma.TransactionClient): Promise<Order>;
  findById(id: number, tx?: Prisma.TransactionClient): Promise<Order | null>;
  findDraftByUserId(
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Order | null>;
  updateStatus(
    orderId: string | number,
    status: OrderStatus,
    tx?: Prisma.TransactionClient,
  ): Promise<Order | null>;
}
