import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async createProduct(data: any) {
    try {
      await this.elasticsearchService.index({
        index: 'products',
        id: data.id,
        document: data,
      });
    } catch (error) {}
  }

  async updateProduct(data: any) {
    await this.elasticsearchService.update({
      index: 'products',
      id: data.id,
      doc: data,
    });
  }

  async removeProduct(data: any) {
    await this.elasticsearchService.delete({
      index: 'products',
      id: data.id,
    });
  }

  async searchProduct(data: any) {
    const result = await this.elasticsearchService.search({
      index: 'products',
      query: {
        match_all: {},
      },
      sort: [{ created_at: 'desc' }],
    });

    return {
      total:
        typeof result.hits.total === 'object'
          ? result.hits.total.value
          : result.hits.total,
      products: result.hits.hits.map((hit) => hit._source),
    };
  }
}
