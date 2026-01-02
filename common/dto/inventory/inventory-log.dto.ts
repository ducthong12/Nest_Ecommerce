// 1. Enum loại hành động (Mở rộng thêm RESTOCK cho đầy đủ)
export type InventoryActionType =
  | 'OUTBOUND'
  | 'RELEASE'
  | 'RESERVE'
  | 'INBOUND';

// 2. Type cho từng sản phẩm nhỏ trong danh sách
export class InventoryItemDto {
  productId: string;
  quantity: number;
}

// 3. Type cho Message nhận từ Kafka (Input của addToBuffer)
export class InventoryEventDto {
  orderId: string;
  type: InventoryActionType;
  items: InventoryItemDto[];
}

// 4. Type nội bộ để tính toán (Sau khi đã làm phẳng mảng items)
// Dùng cho hàm calculateStockChanges
export interface FlatInventoryLog {
  productId: string;
  quantity: number;
  type: InventoryActionType;
  orderId: string;
}
