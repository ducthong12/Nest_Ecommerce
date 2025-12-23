import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number) // Convert từ string sang number nếu gửi form-data
  price: number;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // External ID (Postgres)
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  // Internal Relation (MongoDB ObjectId)
  @IsMongoId({ message: 'Brand ID không hợp lệ' })
  @IsNotEmpty()
  brand: string; // Client gửi lên string ID

  @IsMongoId({ message: 'Category ID không hợp lệ' })
  @IsNotEmpty()
  category: string;

  @IsArray()
  @IsOptional()
  specifications?: { k: string; v: string; u?: string }[];
}
