import { Controller } from '@nestjs/common';
import { SearchService } from './search.service';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @EventPattern('search.create_product')
  async handleProductCreated(@Payload() message: any, @Ctx() context: KafkaContext,) {
    return await this.searchService.createProduct(message);
  }

  @EventPattern('search.update_product')
  async handleProductUpdated(@Payload() message: any, @Ctx() context: KafkaContext,) {
    return await this.searchService.updateProduct(message);
  }

  @EventPattern('search.delete_product')
  async handleProductDeleted(@Payload() message: any, @Ctx() context: KafkaContext,) {
    return await this.searchService.removeProduct(message);
  }
}
