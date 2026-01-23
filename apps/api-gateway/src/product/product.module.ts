import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductControllerV1 } from './product.controller';

@Module({
  controllers: [ProductControllerV1],
  providers: [ProductService],
})
export class ProductModule {}
