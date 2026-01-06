import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

@Module({
  imports: [
    ElasticsearchModule.register({
      node: 'http://localhost:9200',
    }), 
    ClientsModule.register([
    {
      name: 'SEARCH_KAFKA_CLIENT',
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'search-service',
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        },
        producer: {
          allowAutoTopicCreation: true,
          idempotent: true,
          createPartitioner: Partitioners.LegacyPartitioner,
        },
      },
    }])
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
