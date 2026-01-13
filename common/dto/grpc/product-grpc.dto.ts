import { Observable } from 'rxjs';
import { CreateProductDto } from '../product/create-product.dto';
import { FilterProductDto } from '../product/filter-product.dto';
import { CreateCategoryDto } from '../product/create-category.dto';
import { UpdateProductDto } from '../product/update-product.dto';
import { CreateBrandDto } from '../product/create-brand.dto';
import { UpdatePriceDto } from '../product/update-price.dto';

export class ProductGrpcDto {
  createProduct: (data: CreateProductDto) => Observable<any>;
  createManyProduct: (data: {
    products: CreateProductDto[];
  }) => Observable<any>;
  updateProduct: (data: UpdateProductDto) => Observable<any>;
  findOneProduct: (data: { id: string }) => Observable<any>;
  findAllProducts: (data: FilterProductDto) => Observable<any>;
  createCategory: (data: CreateCategoryDto) => Observable<any>;
  createBrand: (data: CreateBrandDto) => Observable<any>;
  updatePrice: (data: UpdatePriceDto) => Observable<any>;
}
