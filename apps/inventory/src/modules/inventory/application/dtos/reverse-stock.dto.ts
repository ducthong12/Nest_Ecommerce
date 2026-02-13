import { IsArray, IsNotEmpty } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class ReserveStockDto {
  @IsArray()
  @IsNotEmpty()
  items: OrderItemDto[];
}
