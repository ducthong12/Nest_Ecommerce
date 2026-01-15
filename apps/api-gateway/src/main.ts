import { initTracing } from 'common/jaeger/tracing';
initTracing('api-gateway');
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { join } from 'path';
import * as fs from 'fs';
import { createLoggerConfig } from 'common/logger/winston.config';
import { WinstonModule } from 'nest-winston';
import { LoggingInterceptor } from 'common/interceptor/logging.interceptor';
import { AllExceptionsFilter } from 'common/filters/all-exceptions.filter';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(
      join(__dirname, '../../../keys', 'app.test.local+3-key.pem'),
    ),
    cert: fs.readFileSync(
      join(__dirname, '../../../keys', 'app.test.local+3.pem'),
    ),
  };

  const app = await NestFactory.create(ApiGatewayModule, {
    httpsOptions,
    logger: WinstonModule.createLogger(createLoggerConfig('api-gateway')),
  });

  app.enableCors({
    origin: [
      'https://app.test.local:3001',
      'https://localhost:3001',
      'https://api.test.local:3000',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapter),
    new HttpExceptionFilter(),
  );
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );
  app.setGlobalPrefix('api');
  await app.listen(process.env.API_GATEWAY_PORT ?? 3000);
}

bootstrap()
  .then(() => {
    console.log('API Gateway Successfully Started');
  })
  .catch((err) => {
    console.error('Error starting API Gateway:', err);
  });
