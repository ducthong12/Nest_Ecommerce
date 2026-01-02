import { NestFactory } from '@nestjs/core';
import { SearchModule } from './search.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

async function bootstrap() {
  const app = await NestFactory.create(SearchModule);
  
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
        },
        producer: {
          createPartitioner: Partitioners.LegacyPartitioner,
        },
        consumer: {
          groupId: 'search-consumer-group', 
          allowAutoTopicCreation: true,
          fromBeginning: true,
        },
      },
    });
  
    await app.startAllMicroservices();
  
    await app.listen(6666);
}
bootstrap();
