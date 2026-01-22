import { Controller } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  Ctx,
  EventPattern,
  GrpcMethod,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { RestockStockDto } from 'common/dto/inventory/restock-stock.dto';
import { ReserveStockDto } from 'common/dto/inventory/reverse-stock.dto';
import { ReleaseStockDto } from 'common/dto/inventory/release-stock.dto';
import { OrderCanceledEvent } from 'common/dto/order/order-canceled.event';

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
