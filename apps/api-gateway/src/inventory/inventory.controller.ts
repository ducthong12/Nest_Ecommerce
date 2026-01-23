import { Body, Controller, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RestockInventoryDto } from 'common/dto/inventory/restock-stock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('restockInventory')
  async restockInventory(@Body() RestockInventoryDto: RestockInventoryDto) {
    return await this.inventoryService.restockInventory(RestockInventoryDto);
  }
}
