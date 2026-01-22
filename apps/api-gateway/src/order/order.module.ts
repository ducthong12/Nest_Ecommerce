import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
