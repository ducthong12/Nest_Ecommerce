import { Controller, Get } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('products')
  async searchProducts() {
    return await this.searchService.searchProducts();
  }
}
