import 'dotenv/config';
import { initTracing } from 'common/jaeger/tracing';
initTracing('inventory-service');
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { ValidationPipe } from '@nestjs/common';
import { Partitioners } from 'kafkajs';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';
import { LoggingInterceptor } from 'common/interceptor/logging.interceptor';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from 'common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule, {
    logger: WinstonModule.createLogger(createLoggerConfig('inventory-service')),
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.INVENTORY_PACKAGE,
      protoPath: join(__dirname, '/inventory.proto'),
      url: process.env.INVENTORY_GRPC_URL,
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
        groupId: 'inventory-consumer-group',
        allowAutoTopicCreation: true,
        fromBeginning: true,
      },
    },
  });

  // app.enableCors();

  app.useGlobalPipes(new ValidationPipe());
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.startAllMicroservices();
  await app.listen(process.env.INVENTORY_SERVICE_PORT);
}

bootstrap()
  .then(() => {
    console.log(
      `Inventory Service Successfully Started on port ${process.env.INVENTORY_SERVICE_PORT}`,
    );
  })
  .catch((error) => {
    console.error('Inventory Service Fail Started', error);
  });
