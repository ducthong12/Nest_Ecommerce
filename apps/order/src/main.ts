import 'dotenv/config';
import { initTracing } from 'common/jaeger/tracing';
initTracing('order-service');
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { Partitioners } from 'kafkajs';
import { createLoggerConfig } from 'common/logger/winston.config';
import { WinstonModule } from 'nest-winston';
import { LoggingInterceptor } from 'common/interceptor/logging.interceptor';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule, {
    logger: WinstonModule.createLogger(createLoggerConfig('order-service')),
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.ORDER_PACKAGE,
      protoPath: join(__dirname, '/order.proto'),
      url: process.env.ORDER_GRPC_URL,
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
        groupId: 'order-consumer-group',
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
  await app.listen(process.env.ORDER_SERVICE_PORT);
}

bootstrap()
  .then(() => {
    console.log(
      `Order Service Successfully Started on port ${process.env.ORDER_SERVICE_PORT}`,
    );
  })
  .catch((error) => {
    console.error('Order Service Fail Started', error);
  });
