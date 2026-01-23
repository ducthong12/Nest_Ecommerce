import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class OrderCanceledEvent {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'COMPLETED' | 'CANCELED';

  @IsArray()
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: Array<OrderItemDto>;

  @Type(() => Date)
  @IsNotEmpty()
  updatedAt: Date;
}
