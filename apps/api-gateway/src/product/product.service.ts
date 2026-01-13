import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ProductGrpcDto } from 'common/dto/grpc/product-grpc.dto';
import { CreateBrandDto } from 'common/dto/product/create-brand.dto';
import { CreateCategoryDto } from 'common/dto/product/create-category.dto';
import { CreateProductDto } from 'common/dto/product/create-product.dto';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { UpdateProductDto } from 'common/dto/product/update-product.dto';
import { UpdatePriceDto } from 'common/dto/product/update-price.dto';

@Injectable()
export class ProductService {
  private productService: ProductGrpcDto;

  constructor(
    @Inject(NAME_SERVICE_GRPC.PRODUCT_SERVICE) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.productService = this.client.getService<ProductGrpcDto>(
      NAME_SERVICE_GRPC.PRODUCT_SERVICE,
    );
  }

  async createProduct(createProductDto: CreateProductDto) {
    try {
      return await firstValueFrom(
        this.productService.createProduct(createProductDto).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `create product: ${JSON.stringify(createProductDto)}`,
        'Product Service',
      );
    }
  }

  async createManyProduct(createManyProductDto: CreateProductDto[]) {
    try {
      return await firstValueFrom(
        this.productService
          .createManyProduct({ products: createManyProductDto })
          .pipe(
            timeout(10000),
            catchError((error) => throwError(() => error)),
          ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `create many product: ${JSON.stringify(createManyProductDto)}`,
        'Product Service',
      );
    }
  }

  async findAllProducts() {
    try {
      return await firstValueFrom(
        this.productService.findAllProducts({}).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `findAllProducts`,
        'Product Service',
      );
    }
  }

  async findOneProduct(id: string) {
    try {
      return await firstValueFrom(
        this.productService.findOneProduct({ id }).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `findOneProduct with ID: ${id}`,
        'Product Service',
      );
    }
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    try {
      return await firstValueFrom(
        this.productService.createCategory(createCategoryDto).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `createCategory with DTO: ${JSON.stringify(createCategoryDto)}`,
        'Product Service',
      );
    }
  }

  async createBrand(createBrandDto: CreateBrandDto) {
    try {
      return await firstValueFrom(
        this.productService.createBrand(createBrandDto).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `createBrand with DTO: ${JSON.stringify(createBrandDto)}`,
        'Product Service',
      );
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    try {
      return await firstValueFrom(
        this.productService.updateProduct({ id, ...updateProductDto }).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `updateProduct with DTO: ${JSON.stringify(updateProductDto)}`,
        'Product Service',
      );
    }
  }

  async updatePrice(updatePriceDto: UpdatePriceDto) {
    try {
      return await firstValueFrom(
        this.productService.updatePrice(updatePriceDto).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `updatePrice with DTO: ${JSON.stringify(updatePriceDto)}`,
        'Product Service',
      );
    }
  }

  // removeProduct(id: number) {
  //   return this.productService.removeProduct({ id });
  // }
}
