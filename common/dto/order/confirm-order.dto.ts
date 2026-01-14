import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class ConfirmOrderDto {
  @Type(() => BigInt)
  @IsNumber()
  @IsNotEmpty()
  orderId: bigint;
}
