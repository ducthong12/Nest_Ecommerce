import 'dotenv/config';
import { initTracing } from 'common/jaeger/tracing';
initTracing('user-service');
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { WinstonModule } from 'nest-winston';
import { createLoggerConfig } from 'common/logger/winston.config';
import { LoggingInterceptor } from 'common/interceptor/logging.interceptor';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(UserModule, {
    logger: WinstonModule.createLogger(createLoggerConfig('user-service')),
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.USER_PACKAGE,
      protoPath: join(__dirname, '/user.proto'),
      url: process.env.USER_GRPC_URL,
    },
  });

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  // Kích hoạt ValidationPipe toàn cục
  // app.useGlobalPipes();

  await app.listen(process.env.USER_SERVICE_PORT);
}

bootstrap()
  .then(() => {
    console.log(
      `User Service Successfully Started on port ${process.env.USER_SERVICE_PORT}`,
    );
  })
  .catch((error) => {
    console.error('User Service Fail Started', error);
  });
