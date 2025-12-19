import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import {
  NAME_SERVICE_GRPC,
  PORT_GRPC,
} from '@common/constants/port-grpc.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    InventoryModule,
    {
      transport: Transport.GRPC,
      options: {
        package: NAME_SERVICE_GRPC.INVENTORY_PACKAGE,
        protoPath: join(__dirname, '/inventory.proto'), // Đường dẫn đến file proto
        url: `0.0.0.0:${PORT_GRPC.INVENTORY_PORT_GRPC}`,
      },
    },
  );

  await app.listen();
}

bootstrap()
  .then(() => {
    console.log('Inventory Service Successfully Started');
  })
  .catch(() => {
    console.error('Inventory Service Fail Started');
  });
