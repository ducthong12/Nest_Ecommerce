import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ReleaseStockDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @IsNotEmpty()
  items: { productId: string; quantity: number }[];
}
