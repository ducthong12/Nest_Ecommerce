import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { ClientGrpc } from '@nestjs/microservices';
import { OrderGrpcDto } from 'common/dto/grpc/order-grpc.dto';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { InventoryGrpcDto } from 'common/dto/grpc/inventory-grpc.dto';
import { CreateOrderDto } from 'common/dto/order/create-order.dto';
import { UpdateOrderDto } from 'common/dto/order/update-order.dto';

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

  async createOrder(data: CreateOrderDto) {
    try {
      const order = await firstValueFrom(
        this.orderService.createOrder(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );

      return {
        message: 'Create order.',
        orderId: order.id,
      };
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `create order with data: ${JSON.stringify(data)}`,
        'Order Service',
      );
    }
  }

  async updateOrder(data: UpdateOrderDto) {
    try {
      const order = await firstValueFrom(
        this.orderService.updateOrder(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );

      return {
        message: 'Update order.',
        orderId: order.id,
      };
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `update order with data: ${JSON.stringify(data)}`,
        'Order Service',
      );
    }
  }

  async checkout(data: OrderCheckoutDto) {
    try {
      const stockResponse = await firstValueFrom(
        this.inventoryService.reserveStockInventory(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );

      if (!stockResponse.success) {
        throw new BadRequestException('Out of stock');
      }

      const order = await firstValueFrom(
        this.orderService.orderCheckout(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );

      return {
        message: 'Order checkout. Please pay within 10 minutes.',
        orderId: order.id,
      };
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `checkout order with data: ${JSON.stringify(data)}`,
        'Order Service',
      );
    }
  }

  async syncOrder(data: CreateOrderDto | UpdateOrderDto) {
    try {
      const order = await firstValueFrom(
        this.orderService.syncOrder(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );

      return {
        message: 'Sync order.',
        orderId: order.id,
      };
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `sync order with data: ${JSON.stringify(data)}`,
        'Order Service',
      );
    }
  }

  async getOrderDraft() {
    try {
      return await firstValueFrom(
        this.orderService.getOrderDraft({}).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `getOrderDraft`,
        'Order Service',
      );
    }
  }

  async getOrderById(id: number) {
    try {
      return await firstValueFrom(
        this.orderService.getOrderById({ id }).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `getOrderById with ID: ${id}`,
        'Order Service',
      );
    }
  }
}
