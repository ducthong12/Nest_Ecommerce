import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SearchOrdersDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  from?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  size?: number;

  @IsString()
  @IsOptional()
  valueSearch?: string;

  @IsString()
  @IsNotEmpty()
  activeTab: string;
}
