import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export type InventoryActionType =
  | 'OUTBOUND'
  | 'RELEASE'
  | 'RESERVE'
  | 'INBOUND';

export class UpdateSnapShotProductDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  type: InventoryActionType;
}
