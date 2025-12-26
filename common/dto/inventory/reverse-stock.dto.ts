import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ReserveStockDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @IsNotEmpty()
  items: { productId: string; quantity: number }[];
}
