import { NestFactory } from '@nestjs/core';
import { ProductModule } from './product.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  NAME_SERVICE_GRPC,
  PORT_GRPC,
} from '@common/constants/port-grpc.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductModule,
    {
      transport: Transport.GRPC,
      options: {
        package: NAME_SERVICE_GRPC.PRODUCT_PACKAGE,
        protoPath: join(__dirname, '/product.proto'), // Đường dẫn đến file proto
        url: `0.0.0.0:${PORT_GRPC.PRODUCT_PORT_GRPC}`, // Lắng nghe trên port 50052
      },
    },
  );

  await app.listen();
}

bootstrap()
  .then(() => {
    console.log('Product Service Successfully Started');
  })
  .catch(() => {
    console.error('Product Service Fail Started');
  });
