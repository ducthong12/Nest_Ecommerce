import 'dotenv/config';
import { initTracing } from 'common/jaeger/tracing';
initTracing('product-service');
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ProductModule } from './product.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from 'common/logger/winston.config';
import { LoggingInterceptor } from 'common/interceptor/logging.interceptor';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';
import { Partitioners } from 'kafkajs';

async function bootstrap() {
  const app = await NestFactory.create(ProductModule, {
    logger: WinstonModule.createLogger(createLoggerConfig('product-service')),
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.PRODUCT_PACKAGE,
      protoPath: join(__dirname, '/product.proto'),
      url: process.env.PRODUCT_GRPC_URL,
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
        groupId: 'product-consumer-group',
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
  await app.listen(process.env.PRODUCT_SERVICE_PORT);
}

bootstrap()
  .then(() => {
    console.log(
      `Product Service Successfully Started on port ${process.env.PRODUCT_SERVICE_PORT}`,
    );
  })
  .catch(() => {
    console.error('Product Service Fail Started');
  });
