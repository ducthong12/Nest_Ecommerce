import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchProductsDto } from 'common/dto/search/search-products.dto';

@Injectable()
export class SearchService {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  onModuleInit() {
    this.createProductIndex();
  }

  async createProductIndex() {
    const indexName = 'products';

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
        settings: {
          analysis: {
            analyzer: {
              product_analyzer: {
                tokenizer: 'whitespace',
                filter: ['lowercase', 'word_delimiter_graph', 'asciifolding'],
              },
            },
          },
        },
        mappings: {
          properties: {
            // Trường tổng hợp để search "bất chấp" từ khóa nằm ở đâu
            all_text: {
              type: 'text',
              analyzer: 'product_analyzer',
            },
            name: {
              type: 'text',
              analyzer: 'product_analyzer',
              copy_to: 'all_text', // <--- Gom vào all_text
            },
            brandName: {
              type: 'text',
              analyzer: 'product_analyzer',
              copy_to: 'all_text', // <--- Gom vào all_text
              fields: {
                keyword: { type: 'keyword' }, // Vẫn giữ bản keyword để dùng cho Filter/Sort nếu cần
              },
            },
            categoryName: {
              type: 'text',
              analyzer: 'product_analyzer',
              copy_to: 'all_text',
            },
            variants: {
              type: 'object',
              properties: {
                attributes: {
                  properties: {
                    k: { type: 'keyword' },
                    v: {
                      type: 'text',
                      analyzer: 'product_analyzer',
                      copy_to: 'all_text', // <--- Gom màu sắc, dung lượng vào all_text
                    },
                  },
                },
              },
            },
            minPrice: { type: 'long' },
            created_at: { type: 'date' },
          },
        },
      } as any,
    });
  }

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

  async searchProductInventory(query: SearchProductsDto) {
    let searchQuery: any;
    const userId = '1001';

    if (query.valueSearch) {
      searchQuery = {
        bool: {
          must: [
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
                userId: userId,
              },
            },
          ],
          should: [
            {
              // TĂNG ĐIỂM (BOOST): Nếu khớp chính xác cụm từ thì đưa lên đầu
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
      searchQuery = { match_all: {} };
    }

    const result = await this.elasticsearchService.search({
      index: 'products',
      from: query.from || 0,
      size: query.size || 50,
      query: searchQuery,
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

  async searchProduct(query: SearchProductsDto) {
    let searchQuery: any;

    if (query.valueSearch) {
      searchQuery = {
        bool: {
          must: [
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
              // TĂNG ĐIỂM (BOOST): Nếu khớp chính xác cụm từ thì đưa lên đầu
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
      searchQuery = { match_all: {} };
    }

    const result = await this.elasticsearchService.search({
      index: 'products',
      from: query.from || 0,
      size: query.size || 50,
      query: searchQuery,
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
