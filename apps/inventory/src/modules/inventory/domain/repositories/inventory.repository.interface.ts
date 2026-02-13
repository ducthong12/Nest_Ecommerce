import { Prisma } from '@prisma/client';
import { Inventory } from '../model/inventory.entity';

export interface IInventoryRepository {
  addStock(
    data: {
      sku: string;
      productId: string;
      quantity: number;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Inventory>;
  decreaseStock(
    data: {
      sku: string;
      productId: string;
      quantity: number;
    }[],
    tx?: Prisma.TransactionClient,
  ): Promise<void>;
}
