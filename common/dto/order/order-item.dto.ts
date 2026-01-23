import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  price: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  productName?: string;
}
