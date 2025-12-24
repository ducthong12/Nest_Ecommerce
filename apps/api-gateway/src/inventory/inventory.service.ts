import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { InventoryGrpcDto } from 'common/dto/grpc/inventory-grpc.dto';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { RestockProductDto } from 'common/dto/restock/restock-product.dto';

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

  async restockProduct(restockProductDto: RestockProductDto) {
    try {
      return await firstValueFrom(
        this.inventoryService.restockProduct(restockProductDto).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `restock product: ${JSON.stringify(restockProductDto)}`,
        'Inventory Service',
      );
    }
  }
}
