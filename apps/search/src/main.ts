import { initTracing } from 'common/jaeger/tracing';
initTracing('search-service');
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SearchModule } from './search.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from 'common/logger/winston.config';
import { LoggingInterceptor } from 'common/interceptor/logging.interceptor';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(SearchModule, {
    logger: WinstonModule.createLogger(createLoggerConfig('search-service')),
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.SEARCH_PACKAGE,
      protoPath: join(__dirname, '/search.proto'),
      url: `127.0.0.1:50056`,
    },
  });

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

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  await app.startAllMicroservices();
  await app.listen(6996);
}

bootstrap()
  .then(() => {
    console.log('Search Service Successfully Started');
  })
  .catch(() => {
    console.error('Search Service Fail Started');
  });
