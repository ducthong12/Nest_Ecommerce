import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentByCashDto {
  @Type(() => BigInt)
  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
