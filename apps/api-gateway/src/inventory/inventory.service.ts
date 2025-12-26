import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { InventoryGrpcDto } from 'common/dto/grpc/inventory-grpc.dto';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { RestockStockDto } from 'common/dto/inventory/restock-stock.dto';

@Injectable()
export class InventoryService {
  private inventoryService: InventoryGrpcDto;

  constructor(
    @Inject(NAME_SERVICE_GRPC.INVENTORY_SERVICE) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.inventoryService = this.client.getService<InventoryGrpcDto>(
      NAME_SERVICE_GRPC.INVENTORY_SERVICE,
    );
  }

  async reserveStock(data: ReserveStockDto) {
    try {
      return await firstValueFrom(
        this.inventoryService.reserveStock(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `reserve stock: ${JSON.stringify(data)}`,
        'Inventory Service',
      );
    }
  }

  async restockStock(data: RestockStockDto) {
    try {
      return await firstValueFrom(
        this.inventoryService.restockStock(data).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `restock stock: ${JSON.stringify(data)}`,
        'Inventory Service',
      );
    }
  }
}
