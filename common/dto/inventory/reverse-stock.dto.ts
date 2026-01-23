import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { OrderItemDto } from '../order/order-item.dto';

export class ReserveStockInventoryDto {
  @IsArray()
  @IsNotEmpty()
  items: OrderItemDto[];
}
