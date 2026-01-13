import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { OrderItemDto } from '../order/order-item.dto';

export class ReleaseStockDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @IsNotEmpty()
  items: OrderItemDto[];
}
