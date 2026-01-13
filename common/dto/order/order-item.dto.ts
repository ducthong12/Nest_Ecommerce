import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class OrderItemDto {
  @Type(() => BigInt)
  @IsNumber()
  @IsNotEmpty()
  orderId: bigint;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  sku: string;
}
