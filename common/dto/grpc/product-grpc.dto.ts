import { Observable } from 'rxjs';
import { CreateProductDto } from '../product/create-product.dto';
import { FilterProductDto } from '../product/filter-product.dto';
import { CreateCategoryDto } from '../product/create-category.dto';
import { UpdateProductDto } from '../product/update-product.dto';

export class ProductGrpcDto {
  createProduct: (data: CreateProductDto) => Observable<any>;
  updateProduct: (data: UpdateProductDto) => Observable<any>;
  findOneProduct: (data: { id: number }) => Observable<any>;
  findAllProducts: (data: FilterProductDto) => Observable<any>;
  createCategory: (data: CreateCategoryDto) => Observable<any>;
  createBrand: (data: CreateCategoryDto) => Observable<any>;
}
