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
import { KafkaRetry } from '@common/decorators/kafka-retry.decorator';
import { PrismaInventoryService } from '../prisma/prismaInventory.service';
import { OrderCheckoutDto } from 'common/dto/order/order-checkout.dto';

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
  @KafkaRetry({
    maxRetries: 2,
    dltTopic: 'inventory.order.canceled.failed',
    clientToken: 'INVENTORY_KAFKA_CLIENT',
    dbToken: PrismaInventoryService,
  })
  async handleOrderCanceled(
    @Payload() message: OrderCanceledEvent,
    @Ctx() context: KafkaContext,
  ) {
    await this.inventoryService.processOrderCanceled(message);
  }

  @EventPattern('order.checkout.failed')
  @KafkaRetry({
    maxRetries: 2,
    dltTopic: 'inventory.order.checkout.failed.dlt',
    clientToken: 'INVENTORY_KAFKA_CLIENT',
    dbToken: PrismaInventoryService,
  })
  async handleOrderCheckoutFailed(
    @Payload() message: OrderCheckoutDto & { id: string },
    @Ctx() context: KafkaContext,
  ) {
    await this.inventoryService.processOrderCheckoutFailed(message);
  }

  @EventPattern('redis.addstock')
  @KafkaRetry({
    maxRetries: 2,
    dltTopic: 'inventory.redis.addstock.failed',
    clientToken: 'INVENTORY_KAFKA_CLIENT',
    dbToken: PrismaInventoryService,
  })
  async handleRedisAddStock(
    @Payload() message: { sku: string; quantity: number },
    @Ctx() context: KafkaContext,
  ) {
    await this.inventoryService.redisAddStock(message);
  }
}
