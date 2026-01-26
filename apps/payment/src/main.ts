import 'dotenv/config';
import { initTracing } from 'common/jaeger/tracing';
initTracing('payment-service');
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from 'common/logger/winston.config';
import { LoggingInterceptor } from 'common/interceptor/logging.interceptor';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule, {
    logger: WinstonModule.createLogger(createLoggerConfig('payment-service')),
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.PAYMENT_PACKAGE,
      protoPath: join(__dirname, '/payment.proto'),
      url: process.env.PAYMENT_GRPC_URL,
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
        groupId: 'payment-consumer-group',
        allowAutoTopicCreation: true,
        fromBeginning: true,
      },
    },
  });

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  await app.startAllMicroservices();
  await app.listen(process.env.PAYMENT_SERVICE_PORT);
}

bootstrap()
  .then(() => {
    console.log(
      `Payment Service Successfully Started on port ${process.env.PAYMENT_SERVICE_PORT}`,
    );
  })
  .catch((error) => {
    console.error('Payment Service Fail Started', error);
  });
