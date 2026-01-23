import { IsArray } from 'class-validator';
import { OrderItemDto } from './order-item.dto';
import { Type } from 'class-transformer';

export class OrderCheckoutDto {
  @IsArray()
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
