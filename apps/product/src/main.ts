import { NestFactory } from '@nestjs/core';
import { ProductModule } from './product.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductModule,
    {
      transport: Transport.GRPC,
      options: {
        package: NAME_SERVICE_GRPC.PRODUCT_PACKAGE,
        protoPath: join(__dirname, '/product.proto'), // Đường dẫn đến file proto
        url: `127.0.0.1:50052`, // Lắng nghe trên port 50052
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
