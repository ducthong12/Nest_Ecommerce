import { Controller } from '@nestjs/common';
import { EventPattern, GrpcMethod } from '@nestjs/microservices';
import { ProductService } from './product.service';
import { CreateProductDto } from 'common/dto/product/create-product.dto';
import { FilterProductDto } from 'common/dto/product/filter-product.dto';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';
import { UpdateProductDto } from 'common/dto/product/update-product.dto';
import { UpdateSnapShotProductDto } from 'common/dto/product/updateSnapshot-product.dto';
import { UpdatePriceDto } from 'common/dto/product/update-price.dto';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod('ProductService', 'CreateProduct')
  async createProduct(data: CreateProductDto) {
    const result = await this.productService.create(data);
    return this.mapToProto(result);
  }

  @GrpcMethod('ProductService', 'CreateManyProduct')
  async createManyProduct({ products }: { products: CreateProductDto[] }) {
    const result = await this.productService.createMany({ products });
    return result;
  }

  @GrpcMethod('ProductService', 'UpdateProduct')
  async updateProduct(data: UpdateProductDto) {
    const result = await this.productService.update(data.id, data);
    return this.mapToProto(result);
  }

  @GrpcMethod('ProductService', 'UpdateManyProduct')
  async updateManyProduct(data: UpdateProductDto[]) {
    const result = await this.productService.updateMany(data);
    return this.mapToProto(result);
  }

  @GrpcMethod('ProductService', 'FindOneProduct')
  async findOneProduct(data: { id: string }) {
    const result = await this.productService.findOne(data.id);
    return {
      product: this.mapToProto(result),
    };
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

  @GrpcMethod('ProductService', 'UpdatePrice')
  async updatePrice(data: UpdatePriceDto) {
    const result = await this.productService.updatePrice(data);
    return result;
  }

  @EventPattern('product.restock')
  async restockProduct(data: UpdateSnapShotProductDto) {
    return await this.productService.addToBuffer({ ...data, type: 'INBOUND' });
  }

  @EventPattern('product.reserve')
  async reserveProduct(data: UpdateSnapShotProductDto) {
    return await this.productService.addToBuffer({ ...data, type: 'OUTBOUND' });
  }

  private mapToProto(product: any) {
    return {
      ...product,
      id: product._id.toString(),
      created_at: product.createdAt ? product.createdAt.toISOString() : '',
    };
  }
}
