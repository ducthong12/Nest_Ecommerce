import { Module } from '@nestjs/common';
import { InventoryController } from './modules/inventory/interface/http/inventory.controller';
import { InventoryService } from './modules/inventory/application/service/inventory.service';

@Module({
  imports: [],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
