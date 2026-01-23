import { Injectable } from '@nestjs/common';
import { PrismaOrderService } from '../prisma/prisma-order.service';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { OrderItemDto } from 'common/dto/order/order-item.dto';
import { ConfirmOrderDto } from 'common/dto/order/confirm-order.dto';
import { OrderCheckoutEvent } from 'common/dto/order/order-checkout.event';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';
import { OrderCanceledEvent } from 'common/dto/order/order-canceled.event';
import { CreateOrderDto } from 'common/dto/order/create-order.dto';
import { UpdateOrderDto } from 'common/dto/order/update-order.dto';
@Injectable()
export class OrderService {
  constructor(private prismaOrder: PrismaOrderService) {}

  async orderCheckout(data: OrderCheckoutDto) {
    try {
      return await this.prismaOrder.$transaction(async (tx) => {
        const draftOrder = await tx.order.findFirst({
          where: { userId: 1, status: 'DRAFT' },
        });

        if (!draftOrder) {
          throw new Error('Draft order not found');
        }

        const order = await tx.order.update({
          where: { id: draftOrder.id },
          data: {
            status: 'PENDING',
          },
          include: { items: true },
        });

        const dataFormat = this.formatOrderCreated(order);

        const outboxEvents = [
          {
            topic: 'order.checkout',
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
    } catch (error) {
      console.error('Error during order checkout:', error);
      throw new Error('Failed to order checkout in Database');
    }
  }

  async createOrder(data: CreateOrderDto) {
    try {
      const amount = data.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      return await this.prismaOrder.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            userId: 1,
            status: 'DRAFT',
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
        return order;
      });
    } catch (error) {
      throw new Error('Failed to create order in Database');
    }
  }

  async updateOrder(data: UpdateOrderDto) {
    try {
      if (data.items.length === 0) {
        this.removeOrder(data.id);
        return;
      }

      const amount = data.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      const skuItems = data.items.map((i) => i.sku);

      const items = await this.prismaOrder.orderItem.findMany({
        where: { orderId: BigInt(data.id) },
      });

      const skuItemsDB = items.map((i) => i.productSku);

      const itemsIdToDelete = items
        .filter((i) => !skuItems.includes(i.productSku))
        .map((i) => i.id);

      const itemsToUpdate = data.items.filter((i) =>
        skuItemsDB.includes(i.sku),
      );

      const itemsToCreate = data.items.filter(
        (i) => !skuItemsDB.includes(i.sku),
      );

      return await this.prismaOrder.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: BigInt(data.id), status: 'DRAFT' },
          data: {
            total: amount,
            items: {
              deleteMany: { id: { in: itemsIdToDelete } },
              create: itemsToCreate.map((i) => ({
                quantity: i.quantity,
                price: i.price,
                productSku: i.sku,
                productId: i.productId,
                productName: i.productName,
              })),
              update: itemsToUpdate.map((item) => {
                const itemId = items.find((i) => i.productSku === item.sku)?.id;
                return {
                  where: { id: itemId },
                  data: {
                    quantity: item.quantity,
                    price: item.price,
                    productSku: item.sku,
                    productId: item.productId,
                    productName: item.productName,
                  },
                };
              }),
            },
          },
          include: { items: true },
        });

        return order;
      });
    } catch (error) {
      throw new Error('Failed to update order in Database');
    }
  }

  async removeOrder(id: string) {
    try {
      await this.prismaOrder.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({
          where: { orderId: BigInt(id) },
        });

        await tx.order.delete({ where: { id: BigInt(id), status: 'DRAFT' } });
      });
    } catch (error) {
      throw new Error('Failed to remove order from Database');
    }
  }

  async syncOrder(data: CreateOrderDto | UpdateOrderDto) {
    try {
      const existingOrder = await this.prismaOrder.order.findFirst({
        where: {
          userId: 1,
          status: 'DRAFT',
        },
        include: { items: true },
      });

      if (existingOrder) {
        const updateData: UpdateOrderDto = {
          id: existingOrder.id.toString(),
          items: 'items' in data ? data.items : [],
        };
        return await this.updateOrder(updateData);
      } else {
        const createData: CreateOrderDto = {
          items: 'items' in data ? data.items : [],
        };
        return await this.createOrder(createData);
      }
    } catch (error) {
      throw new Error('Failed to sync order in Database');
    }
  }

  async processPaymentCanceled(data: CancelOrderDto) {
    try {
      return await this.prismaOrder.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: BigInt(data.orderId), status: 'PENDING' },
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
    } catch (error) {
      throw new Error('Failed to cancel order in Database');
    }
  }

  async getOrderById(id: number) {
    try {
      const result = await this.prismaOrder.order.findUnique({
        where: { id: id },
        include: { items: true },
      });
      return result;
    } catch (error) {
      throw new Error('Failed to get order from Database');
    }
  }

  async getOrderDraft() {
    try {
      const result = await this.prismaOrder.order.findMany({
        where: { status: 'DRAFT', userId: 1 },
        include: { items: true },
      });
      return { orders: result };
    } catch (error) {
      throw new Error('Failed to get order draft from Database');
    }
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
    } catch (error) {
      throw new Error('Failed to confirm order in Database');
    }
  }

  private formatOrderCreated(order: any): OrderCheckoutEvent {
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
