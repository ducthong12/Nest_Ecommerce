import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from 'common/dto/product/create-product.dto';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';
import { UpdateProductDto } from 'common/dto/product/update-product.dto';
import { UpdatePriceDto } from 'common/dto/product/update-price.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('createProduct')
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productService.createProduct(createProductDto);
  }

  @Post('createManyProduct')
  async createManyProduct(@Body() createManyProductDto: CreateProductDto[]) {
    return await this.productService.createManyProduct(createManyProductDto);
  }

  @Get('findOneProduct/:id')
  async findOneProduct(@Param('id') id: string) {
    const result = await this.productService.findOneProduct(id);
    return result;
  }

  @Patch('updateProduct')
  updateProduct(@Body() update: UpdateProductDto) {
    return this.productService.updateProduct(update.id, update);
  }

  @Patch('updatePrice')
  updatePrice(@Body() updatePriceDto: UpdatePriceDto) {
    return this.productService.updatePrice(updatePriceDto);
  }

  @Post('createBrand')
  async createBrand(@Body() createBrandDto: CreateBrandDto) {
    return await this.productService.createBrand(createBrandDto);
  }

  @Post('createCategory')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.productService.createCategory(createCategoryDto);
  }
}
