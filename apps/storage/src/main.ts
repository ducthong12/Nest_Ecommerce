import 'dotenv/config';
import { initTracing } from 'common/jaeger/tracing';
initTracing('storage-service');
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { StorageModule } from './storage.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';
import { Partitioners } from 'kafkajs';
import { LoggingInterceptor } from 'common/interceptor/logging.interceptor';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from 'common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(StorageModule, {
    logger: WinstonModule.createLogger(createLoggerConfig('storage-service')),
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.STORAGE_PACKAGE,
      protoPath: join(__dirname, '/storage.proto'),
      url: process.env.STORAGE_GRPC_URL,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: process.env.KAFKA_BROKERS.split(','),
      },
      producer: {
        createPartitioner: Partitioners.LegacyPartitioner,
      },
      consumer: {
        groupId: 'storage-consumer-group',
        allowAutoTopicCreation: true,
        fromBeginning: true,
      },
    },
  });

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.enableCors();
  await app.startAllMicroservices();
  await app.listen(process.env.STORAGE_SERVICE_PORT);
}

bootstrap()
  .then(() => {
    console.log(
      `Storage Service Successfully Started on port ${process.env.STORAGE_SERVICE_PORT}`,
    );
  })
  .catch(() => {
    console.log('Storage Service Failed to Start');
  });
