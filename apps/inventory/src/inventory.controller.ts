import { Controller } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  Ctx,
  EventPattern,
  GrpcMethod,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { RestockInventoryDto } from 'common/dto/inventory/restock-stock.dto';
import { ReserveStockInventoryDto } from 'common/dto/inventory/reverse-stock.dto';
import { OrderCanceledEvent } from 'common/dto/order/order-canceled.event';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @GrpcMethod('InventoryService', 'RestockInventory')
  async restockInventory(data: RestockInventoryDto) {
    const result = await this.inventoryService.restockInventory(data);
    return result;
  }

  @GrpcMethod('InventoryService', 'ReserveStockInventory')
  async reserveStockInventory(data: ReserveStockInventoryDto) {
    const result = await this.inventoryService.reserveStockInventory(data);
    return result;
  }

  @EventPattern('order.canceled')
  async handleOrderCanceled(
    @Payload() message: OrderCanceledEvent,
    @Ctx() context: KafkaContext,
  ) {
    await this.inventoryService.processOrderCanceled(message);
  }

  @EventPattern('redis.addstock')
  async handleRedisAddStock(
    @Payload() message: { sku: string; quantity: number },
    @Ctx() context: KafkaContext,
  ) {
    await this.inventoryService.redisAddStock(message);
  }
}
