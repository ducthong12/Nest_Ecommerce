import { Body, Controller, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RestockProductDto } from 'common/dto/inventory/restock-product.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('restockProduct')
  async restockProduct(@Body() restockProductDto: RestockProductDto) {
    return await this.inventoryService.restockProduct(restockProductDto);
  }
}
