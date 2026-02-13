// apps/inventory/src/modules/application/dtos/order-item.dto.ts
import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0.01)
  price: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}
