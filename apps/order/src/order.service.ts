import { Inject, Injectable } from '@nestjs/common';
import { PrismaOrderService } from '../prisma/prisma-order.service';
import { ClientKafka } from '@nestjs/microservices';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { OrderItemDto } from 'common/dto/order/order-item.dto';
import { ConfirmOrderDto } from 'common/dto/order/confirm-order.dto';
import { UpdateSnapShotProductDto } from 'common/dto/product/updateSnapshot-product.dto';

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

    const order = await this.prismaOrder.order.create({
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

    this.kafkaClient.emit(
      'inventory.log',
      JSON.stringify({
        items: data.items,
        type: 'OUTBOUND',
      }),
    );

    this.kafkaClient.emit(
      'payment.init',
      JSON.stringify({
        orderId: order.id.toString(),
        amount: amount.toString(),
      }),
    );

    return order;
  }

  async cancelOrder(data: CancelOrderDto) {
    const order = await this.prismaOrder.order.update({
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

    this.kafkaClient.emit(
      'inventory.release',
      JSON.stringify({
        items: items,
      }),
    );

    for (const item of items) {
      this.kafkaClient.emit(
        'product.restock',
        JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          sku: item.sku,
          type: 'INBOUND',
        } as UpdateSnapShotProductDto),
      );
    }

    return order;
  }

  async getOrder(id: number) {
    const result = await this.prismaOrder.order.findUnique({
      where: { id: id },
      include: { items: true },
    });
    return result;
  }

  async confirmOrder(data: ConfirmOrderDto) {
    const order = await this.prismaOrder.order.update({
      where: { id: data.orderId, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });

    return order;
  }
}
