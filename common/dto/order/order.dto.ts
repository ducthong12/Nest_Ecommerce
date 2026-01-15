import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrderItemDto } from './order-item.dto';

enum OrderStatus {
  PENDING,
  CONFIRMED,
  SHIPPED,
  COMPLETED,
  CANCELED,
}

export class OrderDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  status: OrderStatus;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  total: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  createdAt: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  updatedAt?: Date;
}

export class OrderWithItemsDto extends OrderDto {
  @IsArray()
  items: OrderItemDto[];
}
