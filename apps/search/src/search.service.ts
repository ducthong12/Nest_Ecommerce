import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async createProduct(data: any) {
    await this.elasticsearchService.index({
      index: 'products',
      id: data.id, 
      document: data, 
    });
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
}
