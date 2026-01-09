import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SearchProductsDto {
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
}
