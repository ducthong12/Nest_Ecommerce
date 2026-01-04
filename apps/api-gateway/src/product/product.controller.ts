import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from 'common/dto/product/create-product.dto';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';
import { UpdateProductDto } from 'common/dto/product/update-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('createProduct')
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productService.createProduct(createProductDto);
  }

  @Get('findAllProducts')
  async findAllProducts() {
    return await this.productService.findAllProducts();
  }

  @Get('findOneProduct')
  async findOneProduct(id: number) {
    return await this.productService.findOneProduct(id);
  }

  @Patch('updateProduct')
  updateProduct(updateProductDto: UpdateProductDto) {
    return this.productService.updateProduct(
      updateProductDto.id,
      updateProductDto,
    );
  }

  // @Delete('removeProduct')
  // removeProduct(id: number) {
  //   return this.productService.removeProduct(id);
  // }

  @Post('createBrand')
  async createBrand(@Body() createBrandDto: CreateBrandDto) {
    return await this.productService.createBrand(createBrandDto);
  }

  @Post('createCategory')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.productService.createCategory(createCategoryDto);
  }
}
