import { Injectable } from '@nestjs/common';
import { PrismaOrderService } from '../prisma/prisma-order.service';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';

@Injectable()
export class OrderService {
  constructor(private prismaOrder: PrismaOrderService) {}

  async createOrder(data: ReserveStockDto) {
    const order = await this.prismaOrder.order.create({
      data: {
        userId: 1, // Giả định user cố định
        status: 'PENDING',
        total: 100000, // Giả định tính tiền xong
        items: {
          create: data.items.map((i) => ({
            productId: i.product_id,
            quantity: i.quantity,
            price: 50000,
          })),
        },
      },
      include: { items: true }, // Lấy items để dùng cho job
    });

    return order;
  }
}
