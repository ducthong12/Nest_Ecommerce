import { Injectable } from '@nestjs/common';
import { PrismaOrderService } from '../prisma/prisma-order.service';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { OrderItemDto } from 'common/dto/order/order-item.dto';
import { ConfirmOrderDto } from 'common/dto/order/confirm-order.dto';
import { OrderCreatedEvent } from 'common/dto/order/order-created.event';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';
import { OrderCanceledEvent } from 'common/dto/order/order-canceled.event';
@Injectable()
export class OrderService {
  constructor(private prismaOrder: PrismaOrderService) {}

  async createOrder(data: OrderCheckoutDto) {
    const amount = data.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    return await this.prismaOrder.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: 1,
          status: 'PENDING',
          total: amount,
          items: {
            create: data.items.map((i) => ({
              quantity: i.quantity,
              price: i.price,
              productSku: i.sku,
              productId: i.productId,
              productName: i.productName,
            })),
          },
        },
        include: { items: true },
      });

      const dataFormat = this.formatOrderCreated(order);

      const outboxEvents = [
        {
          topic: 'order.created',
          payload: dataFormat,
        },
      ];

      await tx.outbox.createMany({
        data: outboxEvents.map((event) => ({
          topic: event.topic,
          payload: event.payload as any,
          status: 'PENDING',
        })),
      });

      return order;
    });
  }

  async processPaymentCanceled(data: CancelOrderDto) {
    try {
      return await this.prismaOrder.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: data.orderId, status: 'PENDING' },
          data: { status: 'CANCELED' },
        });

        const dataFormat = await this.formatOrderCanceled(order);

        const outboxEvents = [
          {
            topic: 'order.canceled',
            payload: dataFormat,
          },
        ];

        await tx.outbox.createMany({
          data: outboxEvents.map((event) => ({
            topic: event.topic,
            payload: event.payload as any,
            status: 'PENDING',
          })),
        });

        return order;
      });
    } catch (error) {}
  }

  async getOrder(id: number) {
    const result = await this.prismaOrder.order.findUnique({
      where: { id: id },
      include: { items: true },
    });
    return result;
  }

  async processPaymentSuccessed(data: ConfirmOrderDto) {
    try {
      return await this.prismaOrder.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: data.orderId, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        });

        return order;
      });
    } catch (error) {}
  }

  private formatOrderCreated(order: any): OrderCreatedEvent {
    return {
      id: order.id.toString(),
      userId: order.userId,
      totalAmount: order.total,
      status: order.status,
      items: order.items.map((item: any) => ({
        ...item,
        orderId: item.orderId.toString(),
      })),
      createdAt: order.createdAt || new Date(),
    };
  }

  private async formatOrderCanceled(order: any): Promise<OrderCanceledEvent> {
    const items = (
      await this.prismaOrder.orderItem.findMany({
        where: { orderId: order.id },
      })
    ).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price.toNumber(),
      sku: item.productSku,
    })) as OrderItemDto[];

    return {
      id: order.id.toString(),
      userId: order.userId,
      totalAmount: order.total,
      status: order.status,
      updatedAt: order.updatedAt || new Date(),
      items: items,
    };
  }
}
