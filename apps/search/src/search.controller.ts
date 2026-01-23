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
import { SearchProductsDto } from 'common/dto/search/search-products.dto';
import { SearchOrdersService } from './searchOrders/searchOrders.service';
import { SearchOrdersDto } from 'common/dto/search/search-orders.dto';
import { OrderCheckoutEvent } from 'common/dto/order/order-checkout.event';

@Controller()
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly searchOrdersService: SearchOrdersService,
  ) {}

  @EventPattern('search.create_product')
  // @KafkaRetry({
  //   maxRetries: 2,
  //   dltTopic: 'search.create_product.dlt',
  //   clientToken: 'SEARCH_KAFKA_CLIENT',
  // })
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
  async handleProductSearch(@Payload() message: SearchProductsDto) {
    return await this.searchService.searchProduct(message);
  }

  @GrpcMethod('SearchService', 'HandleProductSearchInventory')
  async handleProductSearchInventory(@Payload() message: SearchProductsDto) {
    return await this.searchService.searchProductInventory(message);
  }

  @GrpcMethod('SearchService', 'HandleOrdersSearch')
  async handleOrdersSearch(@Payload() message: SearchOrdersDto) {
    return await this.searchOrdersService.searchOrders(message);
  }

  @EventPattern('order.checkout')
  // @KafkaRetry({
  //   maxRetries: 2,
  //   dltTopic: 'order.created.dlt',
  //   clientToken: 'SEARCH_KAFKA_CLIENT',
  // })
  async handleOrderCreated(
    @Payload() message: OrderCheckoutEvent,
    @Ctx() context: KafkaContext,
  ) {
    return await this.searchOrdersService.processCreateOrder(message);
  }

  @EventPattern('order.updated')
  // @KafkaRetry({
  //   maxRetries: 2,
  //   dltTopic: 'order.updated.dlt',
  //   clientToken: 'SEARCH_KAFKA_CLIENT',
  // })
  async handleOrderUpdated(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    return await this.searchOrdersService.updateOrder(message);
  }
}
