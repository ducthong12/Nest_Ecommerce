import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';
import { CreateProductDto } from 'common/dto/product/create-product.dto';
import { FilterProductDto } from 'common/dto/product/filter-product.dto';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod('ProductService', 'CreateProduct')
  async createProduct(data: CreateProductDto) {
    const result = await this.productService.create(data);
    return this.mapToProto(result);
  }

  @GrpcMethod('ProductService', 'FindAllProducts')
  async findAllProducts(data: FilterProductDto) {
    const result = await this.productService.findAll(data);
    return {
      products: result.data.map(this.mapToProto),
      meta: result.meta,
    };
  }

  @GrpcMethod('ProductService', 'FindOneProduct')
  async findOneProduct(data: { id: string }) {
    const result = await this.productService.findOne(data.id);
    return this.mapToProto(result);
  }

  @GrpcMethod('ProductService', 'CreateCategory')
  async createCategory(data: CreateCategoryDto) {
    const result = await this.productService.createCategory(data);
    return result;
  }

  @GrpcMethod('ProductService', 'CreateBrand')
  async createBrand(data: CreateBrandDto) {
    const result = await this.productService.createBrand(data);
    return result;
  }

  // Helper function để map Mongo Document -> Proto Message
  // Vì Mongo dùng _id (Object), Proto dùng id (String) và snake_case
  private mapToProto(product: any) {
    return {
      ...product,
      id: product._id.toString(),
      brand_name: product.brand?.name || '',
      category_name: product.category?.name || '',
      created_at: product.createdAt ? product.createdAt.toISOString() : '',
    };
  }
}
