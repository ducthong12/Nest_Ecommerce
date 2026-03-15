import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaInventoryService } from '../../../infrastructure/persistence/prisma-inventory.service';
import { PrismaInventoryRepository } from '../../../infrastructure/persistence/prisma-inventory.repository';
import { ReleaseStockCommand } from '../impl/release-stock.command';
import { PrismaOutboxInventoryRepository } from '../../../infrastructure/persistence/prisma-outbox.repository';

@CommandHandler(ReleaseStockCommand)
export class ReleaseStockHandler implements ICommandHandler<ReleaseStockCommand> {
  constructor(
    private readonly prismaInventory: PrismaInventoryService,
    private readonly inventoryRepository: PrismaInventoryRepository,
    private readonly outboxRepository: PrismaOutboxInventoryRepository,
  ) {}

  async execute(command: ReleaseStockCommand): Promise<void> {
    const { item } = command;

    try {
      await this.prismaInventory.$transaction(async (tx) => {
        await this.inventoryRepository.addStock(item, tx);
        await this.outboxRepository.createMany(
          [
            {
              topic: 'inventory.stock.released',
              payload: { item },
              status: 'PENDING',
            },
          ],
          tx,
        );
      });
    } catch (error) {
      throw error;
    }
  }
}
