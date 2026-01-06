import { Controller } from '@nestjs/common';
import { SearchService } from './search.service';
import {
  Ctx,
  EventPattern,
  GrpcMethod,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { KafkaRetry } from '@common/decorators/kafka-retry.decorator';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @EventPattern('search.create_product')
  @KafkaRetry({
    maxRetries: 2,
    dltTopic: 'search.create_product.dlt',
    clientToken: 'SEARCH_KAFKA_CLIENT',
  })
  async handleProductCreated(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    return await this.searchService.createProduct(message);
  }

  @EventPattern('search.update_product')
  async handleProductUpdated(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    return await this.searchService.updateProduct(message);
  }

  @EventPattern('search.delete_product')
  async handleProductDeleted(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    return await this.searchService.removeProduct(message);
  }

  @GrpcMethod('SearchService', 'HandleProductSearch')
  async handleProductSearch(@Payload() message: any) {
    return await this.searchService.searchProduct(message);
  }
}
