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

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.INVENTORY_PACKAGE,
      protoPath: join(__dirname, '/inventory.proto'), // Đường dẫn đến file proto
      url: `127.0.0.1:50054`,
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
        groupId: 'inventory-consumer-group', // Quan trọng: Để định danh nhóm Consumer
        allowAutoTopicCreation: true,
        fromBeginning: true,
      },
    },
  });

  app.useGlobalPipes(new ValidationPipe());
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors();

  await app.startAllMicroservices();
  await app.listen(3333);
}

bootstrap()
  .then(() => {
    console.log('Inventory Service Successfully Started');
  })
  .catch((error) => {
    console.error('Inventory Service Fail Started', error);
  });
