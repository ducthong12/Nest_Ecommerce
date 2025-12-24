import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { GrpcMethod } from '@nestjs/microservices';
import { RestockProductDto } from 'common/dto/restock/restock-product.dto';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @GrpcMethod('InventoryService', 'RestockProduct')
  async restockProduct(data: RestockProductDto) {
    const result = await this.inventoryService.restockProduct(data);
    return result;
  }
}
