import { Body, Controller, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RestockStockDto } from 'common/dto/inventory/restock-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('restockStock')
  async restockStock(@Body() RestockStockDto: RestockStockDto) {
    return await this.inventoryService.restockStock(RestockStockDto);
  }
}
