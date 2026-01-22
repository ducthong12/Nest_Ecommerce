import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { ClientGrpc } from '@nestjs/microservices';
import { OrderGrpcDto } from 'common/dto/grpc/order-grpc.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';

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

  async checkout(data: OrderCheckoutDto) {
    try {
      const stockResponse = await this.inventoryService.reserveStock(data);

      if (!stockResponse.success) {
        throw new BadRequestException('Out of stock');
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
      };
    } catch (error) {
      console.error('Error during checkout:', error);
      MicroserviceErrorHandler.handleError(
        error,
        `checkout order with data: ${JSON.stringify(data)}`,
        'Order Service',
      );
    }
  }

  async getOrder(id: number) {
    try {
      return await firstValueFrom(
        this.orderService.getOrder({ id }).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `getOrder with ID: ${id}`,
        'Order Service',
      );
    }
  }
}
