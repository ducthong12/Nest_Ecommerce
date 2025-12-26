import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { GrpcMethod } from '@nestjs/microservices';
import { RestockStockDto } from 'common/dto/inventory/restock-stock.dto';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { ReleaseStockDto } from 'common/dto/inventory/release-stock.dto';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @GrpcMethod('InventoryService', 'RestockStock')
  async restockStock(data: RestockStockDto) {
    const result = await this.inventoryService.restockStock(data);
    return result;
  }

  @GrpcMethod('InventoryService', 'ReserveStock')
  async reserveStock(data: ReserveStockDto) {
    const result = await this.inventoryService.reserveStock(data);
    return result;
  }

  @GrpcMethod('InventoryService', 'ReleaseStock')
  async release(data: ReleaseStockDto) {
    return this.inventoryService.releaseStock(data);
  }
}
