import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { OrderCheckoutEvent } from 'common/dto/order/order-checkout.event';
import { SearchOrdersDto } from 'common/dto/search/search-orders.dto';

@Injectable()
export class SearchOrdersService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  onModuleInit() {
    this.createOrderIndex();
  }

  async createOrderIndex() {
    const indexName = 'orders';

    const checkIndex = await this.elasticsearchService.indices.exists({
      index: indexName,
    });

    if (checkIndex) {
      console.log(`Index ${indexName} already exists!`);
      return;
    }

    console.log(`Creating index ${indexName}...`);

    await this.elasticsearchService.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            userId: { type: 'integer' },
            status: { type: 'keyword' },
            total: { type: 'double' },
            createdAt: { type: 'date' },
            items: {
              type: 'nested',
              properties: {
                productId: { type: 'keyword' },
                productName: { type: 'text', analyzer: 'standard' },
                productSku: { type: 'keyword' },
                price: { type: 'double' },
                quantity: { type: 'integer' },
              },
            },
          },
        },
      } as any,
    });
  }

  async processCreateOrder(data: OrderCheckoutEvent) {
    try {
      await this.elasticsearchService.index({
        index: 'orders',
        id: data.id,
        document: data,
      });
    } catch (error) {
      throw new Error('Failed to index order in Elasticsearch');
    }
  }

  async updateOrder(data: any) {
    try {
      const { id: _, ...updateFields } = data;

      await this.elasticsearchService.update({
        index: 'orders',
        id: data.id.toString(),
        doc: updateFields,
      });
    } catch (error) {
      throw new Error('Failed to update order in Elasticsearch');
    }
  }

  async removeOrder(data: any) {
    try {
      await this.elasticsearchService.delete({
        index: 'orders',
        id: data.id.toString(),
      });
    } catch (error) {
      throw new Error('Failed to delete order in Elasticsearch');
    }
  }

  async searchOrders(query: SearchOrdersDto) {
    let searchQuery: any;

    const must = [{ term: { userId: 1 } }];

    if (query.activeTab !== 'all') {
      must.push({
        term: { status: query.activeTab },
      } as any);
    }

    if (query.valueSearch) {
      searchQuery = {
        bool: {
          must: [
            ...must,
            {
              match: {
                all_text: {
                  query: query.valueSearch,
                  operator: 'and',
                  fuzziness: 'AUTO',
                  prefix_length: 2,
                },
              },
            },
            {
              term: {
                isActive: true,
              },
            },
          ],
          should: [
            {
              match_phrase: {
                name: {
                  query: query.valueSearch,
                  boost: 5,
                },
              },
            },
          ],
        },
      };
    } else {
      searchQuery = {
        bool: {
          must,
        },
      };
    }

    const result = await this.elasticsearchService.search({
      index: 'orders',
      from: query.from || 0,
      size: query.size || 50,
      query: searchQuery,
      sort: [{ createdAt: 'desc' }],
    });

    return {
      total:
        typeof result.hits.total === 'object'
          ? result.hits.total.value
          : result.hits.total,
      orders: result.hits.hits.map((hit) => hit._source),
    };
  }
}
