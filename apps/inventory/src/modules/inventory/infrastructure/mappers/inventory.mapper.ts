// src/modules/inventory/infrastructure/mappers/inventory.mapper.ts
import { Inventory as PrismaInventory } from '@inventory-prisma-client';
import { Inventory } from '../../domain/model/inventory.entity';

export class InventoryMapper {
  static toDomain(raw: PrismaInventory): Inventory {
    return new Inventory(
      Number(raw.id),
      raw.sku,
      raw.productId,
      raw.stockQuantity,
      raw.reservedStock,
    );
  }
}
