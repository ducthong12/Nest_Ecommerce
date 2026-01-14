import { IsArray, IsNotEmpty } from 'class-validator';
import { OrderItemDto } from '../order/order-item.dto';

export class ReleaseStockDto {
  @IsArray()
  @IsNotEmpty()
  items: OrderItemDto[];
}
