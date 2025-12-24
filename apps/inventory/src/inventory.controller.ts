import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { GrpcMethod } from '@nestjs/microservices';
import { RestockProductDto } from 'common/dto/inventory/restock-product.dto';
import { ReverseProductDto } from 'common/dto/inventory/reverse-product.dto';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @GrpcMethod('InventoryService', 'RestockProduct')
  async restockProduct(data: RestockProductDto) {
    const result = await this.inventoryService.restockProduct(data);
    return result;
  }

  @GrpcMethod('InventoryService', 'ReserveProduct')
  async reserveProduct(data: ReverseProductDto) {
    const result = await this.inventoryService.reserveProduct(data);
    return result;
  }
}
