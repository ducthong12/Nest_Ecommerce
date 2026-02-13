// apps/order-service/src/modules/order/infrastructure/persistence/prisma-order.repository.ts
import { Injectable } from '@nestjs/common';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { OrderMapper } from '../mappers/order.mapper';
import { PrismaOrderService } from './prisma-order.service';
import { Order } from '../../domain/model/order.entity';
import { Prisma } from '@order-prisma-client';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaOrderService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx || this.prisma;
  }

  async create(order: Order, tx?: Prisma.TransactionClient): Promise<Order> {
    const savedOrder = await this.getClient(tx).order.create({
      data: {
        userId: order.userId,
        status: order.status,
        total: order.total,
        items: {
          create: order.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            productSku: i.productSku,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return OrderMapper.toDomain(savedOrder);
  }

  async update(order: Order, tx?: Prisma.TransactionClient): Promise<Order> {
    const savedOrder = await this.getClient(tx).order.update({
      where: { id: Number(order.id) },
      data: {
        userId: order.userId,
        status: order.status,
        total: order.total,
        items: {
          create: order.items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            productSku: i.productSku,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return OrderMapper.toDomain(savedOrder);
  }

  async findById(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Order | null> {
    return this.getClient(tx)
      .order.findUnique({
        where: { id },
        include: { items: true },
      })
      .then((order) => (order ? OrderMapper.toDomain(order) : null));
  }

  async findDraftByUserId(
    userId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Order | null> {
    return this.getClient(tx)
      .order.findFirst({
        where: { userId, status: 'DRAFT' },
        include: { items: true },
      })
      .then((order) => (order ? OrderMapper.toDomain(order) : null));
  }

  async updateStatus(
    orderId: string | number,
    status:
      | 'DRAFT'
      | 'PENDING'
      | 'CONFIRMED'
      | 'SHIPPED'
      | 'COMPLETED'
      | 'CANCELED',
    tx?: Prisma.TransactionClient,
  ): Promise<Order | null> {
    return await this.getClient(tx)
      .order.update({
        where: { id: Number(orderId) },
        data: { status },
        include: { items: true },
      })
      .then((order) => (order ? OrderMapper.toDomain(order) : null));
  }
}
