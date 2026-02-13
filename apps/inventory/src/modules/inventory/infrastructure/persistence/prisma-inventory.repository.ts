import { Injectable } from '@nestjs/common';
import { PrismaInventoryService } from './prisma-inventory.service';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { InventoryMapper } from '../mappers/inventory.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaInventoryRepository implements IInventoryRepository {
  constructor(private readonly prisma: PrismaInventoryService) {}

  private getClient(tx?: any) {
    return tx || this.prisma;
  }

  async addStock(
    data: { sku: string; productId: string; quantity: number },
    tx?: Prisma.TransactionClient,
  ) {
    const savedInventory = await this.getClient(tx).inventory.upsert({
      where: { sku: data.sku },
      update: { stockQuantity: { increment: data.quantity } },
      create: {
        productId: data.productId,
        stockQuantity: data.quantity,
        reservedStock: 0,
        sku: data.sku,
      },
    });

    return InventoryMapper.toDomain(savedInventory);
  }

  async decreaseStock(
    data: { sku: string; productId: string; quantity: number }[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    for (const item of data) {
      await this.getClient(tx).inventory.update({
        where: { sku: item.sku },
        data: { stockQuantity: { decrement: item.quantity } },
      });
    }
  }
}
