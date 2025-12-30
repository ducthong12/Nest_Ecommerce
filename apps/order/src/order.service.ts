import { Inject, Injectable } from '@nestjs/common';
import { PrismaOrderService } from '../prisma/prisma-order.service';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class OrderService {
  constructor(
    private prismaOrder: PrismaOrderService,
    @Inject('ORDER_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async createOrder(data: ReserveStockDto) {
    const order = await this.prismaOrder.order.create({
      data: {
        userId: 1, // Giả định user cố định
        status: 'PENDING',
        total: 100000, // Giả định tính tiền xong
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

    console.log('Order created with ID:', order.id);

    // Gửi tin nhắn Kafka để xử lý việc reserve stock
    this.kafkaClient.emit(
      'inventory.log',
      JSON.stringify({
        orderId: order.id.toString(),
        items: data.items,
        type: 'OUTBOUND',
      }),
    );
    return order;
  }
}
