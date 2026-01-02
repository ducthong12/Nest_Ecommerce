import { Inject, Injectable } from '@nestjs/common';
import { PrismaOrderService } from '../prisma/prisma-order.service';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { ClientKafka } from '@nestjs/microservices';
import { CancelOrderDto } from 'common/dto/order/cancel-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private prismaOrder: PrismaOrderService,
    @Inject('ORDER_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async createOrder(data: ReserveStockDto) {
    const amount = 100000;

    const order = await this.prismaOrder.order.create({
      data: {
        userId: 1,
        status: 'PENDING',
        total: amount,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: 50000,
          })),
        },
      },
      include: { items: true }, // Lấy items để dùng cho job
    });

    // Gửi tin nhắn Kafka để xử lý việc reserve stock
    this.kafkaClient.emit(
      'inventory.log',
      JSON.stringify({
        orderId: order.id.toString(),
        items: data.items,
        type: 'OUTBOUND',
      }),
    );

    //Send order data to payment service via Kafka
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
    }));

    // Gửi tin nhắn Kafka để xử lý việc reserve stock
    this.kafkaClient.emit(
      'inventory.release',
      JSON.stringify({
        orderId: order.id.toString(),
        items: items,
      }),
    );

    return order;
  }
}
