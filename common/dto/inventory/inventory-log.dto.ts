import { OrderItemDto } from '../order/order-item.dto';

export type InventoryActionType =
  | 'OUTBOUND'
  | 'RELEASE'
  | 'RESERVE'
  | 'INBOUND';

export class InventoryEventDto {
  orderId: string;
  type: InventoryActionType;
  items: OrderItemDto[];
}

export interface FlatInventoryLog {
  sku: string;
  productId: string;
  quantity: number;
  type: InventoryActionType;
  orderId: string;
}
