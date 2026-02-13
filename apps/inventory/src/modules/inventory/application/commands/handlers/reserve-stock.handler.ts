import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReserveStockCommand } from '../impl/reserve-stock.command';
import { PrismaInventoryService } from '../../../infrastructure/persistence/prisma-inventory.service';
import { PrismaInventoryRepository } from '../../../infrastructure/persistence/prisma-inventory.repository';

@CommandHandler(ReserveStockCommand)
export class ReserveStockHandler implements ICommandHandler<ReserveStockCommand> {
  constructor(
    private readonly prismaInventory: PrismaInventoryService,
    private readonly inventoryRepository: PrismaInventoryRepository,
  ) {}

  async execute(command: ReserveStockCommand): Promise<void> {
    const { items } = command;

    try {
      const result = await this.prismaInventory.$transaction(async (tx) => {
        await this.inventoryRepository.decreaseStock(items, tx);
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
}
