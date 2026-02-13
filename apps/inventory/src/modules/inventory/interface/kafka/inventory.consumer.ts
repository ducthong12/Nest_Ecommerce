import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class InventoryConsumer {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly inventoryOutboxRepo: InventoryOutboxRepository, // Outbox của Inventory
  ) {}

  @EventPattern('inventory.commands')
  async handleInventoryCommand(@Payload() message: any) {
    if (message.command === 'ReserveStock') {
      try {
        await this.inventoryService.deductStock(message.items);
        await this.inventoryOutboxRepo.create({
          topic: 'order.replies',
          payload: { type: 'StockReserved', orderId: message.orderId },
        });
      } catch (error) {
        await this.inventoryOutboxRepo.create({
          topic: 'order.replies',
          payload: {
            type: 'StockFailed',
            orderId: message.orderId,
            reason: error.message || 'Out of stock',
          },
        });
      }
    }
  }
}
