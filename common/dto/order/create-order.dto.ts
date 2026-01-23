import { IsArray } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @IsArray()
  items: OrderItemDto[];
}
