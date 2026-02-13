import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'order',
      protoPath: join(__dirname, 'order.proto'),
      url: '0.0.0.0:50051',
    },
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  await app.startAllMicroservices();

  await app.listen(3333, '0.0.0.0', () => {
    console.log('HTTP Server is listening on port 3333');
  });
}

bootstrap()
  .then(() => {
    console.log('Order microservice is running...');
  })
  .catch((err) => {
    console.error('Error starting Order microservice:', err);
  });
