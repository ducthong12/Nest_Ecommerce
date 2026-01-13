import { Inject, Injectable } from '@nestjs/common';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { ClientGrpc } from '@nestjs/microservices';
import { SearchGrpcDto } from 'common/dto/grpc/search-grpc.dto';
import { SearchProductsDto } from 'common/dto/search/search-products.dto';

@Injectable()
export class SearchService {
  private searchService: SearchGrpcDto;

  constructor(
    @Inject(NAME_SERVICE_GRPC.SEARCH_SERVICE) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.searchService = this.client.getService<SearchGrpcDto>(
      NAME_SERVICE_GRPC.SEARCH_SERVICE,
    );
  }

  async searchProducts(query: SearchProductsDto) {
    try {
      return await firstValueFrom(
        this.searchService.handleProductSearch(query).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `search product`,
        'Search Service',
      );
    }
  }

  async searchProductsInventory(query: SearchProductsDto) {
    try {
      return await firstValueFrom(
        this.searchService.handleProductSearchInventory(query).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `search product inventory`,
        'Search Service',
      );
    }
  }
}
