import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { ClientGrpc } from '@nestjs/microservices';
import { OrderGrpcDto } from 'common/dto/grpc/order-grpc.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { InventoryGrpcDto } from 'common/dto/grpc/inventory-grpc.dto';

@Injectable()
export class OrderService {
  private orderService: OrderGrpcDto;
  private inventoryService: InventoryGrpcDto;

  constructor(
    @Inject(NAME_SERVICE_GRPC.ORDER_SERVICE) private client: ClientGrpc,
    @Inject(NAME_SERVICE_GRPC.INVENTORY_SERVICE)
    private inventoryClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.orderService = this.client.getService<OrderGrpcDto>(
      NAME_SERVICE_GRPC.ORDER_SERVICE,
    );

    this.inventoryService = this.inventoryClient.getService<InventoryGrpcDto>(
      NAME_SERVICE_GRPC.INVENTORY_SERVICE,
    );
  }

  async checkout(data: OrderCheckoutDto) {
    try {
      const stockResponse = await firstValueFrom(
        this.inventoryService.reserveStock(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );

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
