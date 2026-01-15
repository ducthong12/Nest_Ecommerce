import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchProductsDto } from 'common/dto/search/search-products.dto';
import { SearchOrdersDto } from 'common/dto/search/search-orders.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('products')
  async searchProducts(@Query() query: SearchProductsDto) {
    return await this.searchService.searchProducts(query);
  }

  @Get('productsInventory')
  async searchProductsInventory(@Query() query: SearchProductsDto) {
    return await this.searchService.searchProductsInventory(query);
  }

  @Get('orders')
  async searchOrders(@Query() search: SearchOrdersDto) {
    return await this.searchService.searchOrders(search);
  }
}
