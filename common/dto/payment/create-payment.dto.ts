import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreatePaymentDto {
  @Type(() => BigInt)
  @IsNumber()
  @IsNotEmpty()
  orderId: bigint;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
