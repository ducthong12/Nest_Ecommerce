import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { InventoryService } from '../inventory/inventory.service';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { ClientGrpc } from '@nestjs/microservices';
import { OrderGrpcDto } from 'common/dto/grpc/order-grpc.dto';

@Injectable()
export class OrderService {
  private orderService: OrderGrpcDto;

  constructor(
    private inventoryService: InventoryService,
    @Inject(NAME_SERVICE_GRPC.ORDER_SERVICE) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderGrpcDto>(
      NAME_SERVICE_GRPC.ORDER_SERVICE,
    );
  }

  async checkout(data: ReserveStockDto) {
    const stockResponse = await this.inventoryService.reserveStock(data);

    if (!stockResponse.success) {
      throw new BadRequestException('Out of stock'); // Hết hàng
    }

    const order = await firstValueFrom(
      this.orderService.createOrder(data).pipe(
        timeout(10000),
        catchError((error) => throwError(() => error)),
      ),
    );

    return {
      message: 'Order created. Please pay within 10 minutes.',
      orderId: order.id,
      paymentUrl: `https://payment-gateway.com/pay/${order.id}`,
    };
  }
}
