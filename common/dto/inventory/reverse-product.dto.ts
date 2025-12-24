import { IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ReverseProductDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsArray()
  @IsNotEmpty()
  items: { productId: string; quantity: number }[];
}
