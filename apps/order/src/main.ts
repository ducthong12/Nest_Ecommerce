import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderModule,
    {
      transport: Transport.GRPC,
      options: {
        package: NAME_SERVICE_GRPC.ORDER_PACKAGE,
        protoPath: join(__dirname, '/order.proto'), // Đường dẫn đến file proto
        url: `0.0.0.0:50053`,
      },
    },
  );

  await app.listen();
}

bootstrap();
