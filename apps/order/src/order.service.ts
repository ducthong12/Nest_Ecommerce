import { Inject, Injectable } from '@nestjs/common';
import { PrismaOrderService } from '../prisma/prisma-order.service';
import { ClientKafka } from '@nestjs/microservices';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { OrderItemDto } from 'common/dto/order/order-item.dto';
import { ConfirmOrderDto } from 'common/dto/order/confirm-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private prismaOrder: PrismaOrderService,
    @Inject('ORDER_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

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

      const orderKafkaPayload = this.formatOrderKafkaPayload(order);

      const outboxEvents = [
        {
          topic: 'search.create_order',
          payload: orderKafkaPayload,
        },
        {
          topic: 'inventory.log',
          payload: { items: data.items, type: 'OUTBOUND' },
        },
        {
          topic: 'payment.init',
          payload: { orderId: order.id.toString(), amount: amount.toString() },
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

  async cancelOrder(data: CancelOrderDto) {
    try {
      return await this.prismaOrder.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: data.orderId, status: 'PENDING' },
          data: { status: 'CANCELED' },
        });

        const items = (
          await this.prismaOrder.orderItem.findMany({
            where: { orderId: data.orderId },
          })
        ).map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toNumber(),
          sku: item.productSku,
        })) as OrderItemDto[];

        const outboxEvents = [
          {
            topic: 'search.update_order',
            payload: {
              id: data.orderId.toString(),
              status: 'CANCELED',
            },
          },
          {
            topic: 'inventory.release',
            payload: {
              items: items,
            },
          },
        ];

        for (const item of items) {
          outboxEvents.push({
            topic: 'product.restock',
            payload: {
              productId: item.productId,
              quantity: item.quantity,
              sku: item.sku,
              type: 'INBOUND',
            } as any,
          });
        }

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

  async confirmOrder(data: ConfirmOrderDto) {
    try {
      return await this.prismaOrder.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: data.orderId, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        });

        const outboxEvents = [
          {
            topic: 'search.update_order',
            payload: {
              id: data.orderId.toString(),
              status: 'CONFIRMED',
            },
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

  private formatOrderKafkaPayload(order: any) {
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
}
