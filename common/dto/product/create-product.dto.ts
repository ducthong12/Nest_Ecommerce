import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class VariantAttributeDto {
  @IsString()
  @IsNotEmpty()
  k: string;

  @IsString()
  @IsNotEmpty()
  v: string;
}

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  original_price?: number; 

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantAttributeDto)
  attributes: VariantAttributeDto[];
}

export class ProductSpecificationDto {
  @IsString()
  @IsNotEmpty()
  k: string;

  @IsString()
  @IsNotEmpty()
  v: string;

  @IsString()
  @IsOptional()
  u?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsMongoId({ message: 'Brand ID không hợp lệ' })
  @IsNotEmpty()
  brand: string;

  @IsMongoId({ message: 'Category ID không hợp lệ' })
  @IsNotEmpty()
  category: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Sản phẩm phải có ít nhất 1 biến thể' })
  @ValidateNested({ each: true }) 
  @Type(() => CreateProductVariantDto)
  variants: CreateProductVariantDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationDto)
  specifications?: ProductSpecificationDto[];
}