import { Type } from 'class-transformer';
import { CreateOrderDto } from './create-order.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;
}
