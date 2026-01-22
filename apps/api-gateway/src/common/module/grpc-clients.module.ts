// src/common/modules/grpc-clients.module.ts
import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: NAME_SERVICE_GRPC.INVENTORY_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.INVENTORY_PACKAGE,
          protoPath: join(__dirname, '/inventory.proto'),
          url: `127.0.0.1:50054`,
        },
      },
      {
        name: NAME_SERVICE_GRPC.ORDER_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.ORDER_PACKAGE,
          protoPath: join(__dirname, '/order.proto'),
          url: `127.0.0.1:50053`,
        },
      },
      {
        name: NAME_SERVICE_GRPC.PAYMENT_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.PAYMENT_PACKAGE,
          protoPath: join(__dirname, '/payment.proto'),
          url: `127.0.0.1:50055`,
        },
      },
      {
        name: NAME_SERVICE_GRPC.PRODUCT_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.PRODUCT_PACKAGE,
          protoPath: join(__dirname, '/product.proto'),
          url: `127.0.0.1:50052`,
        },
      },
      {
        name: NAME_SERVICE_GRPC.SEARCH_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.SEARCH_PACKAGE,
          protoPath: join(__dirname, '/search.proto'),
          url: `127.0.0.1:50056`,
        },
      },
      {
        name: NAME_SERVICE_GRPC.USER_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.USER_PACKAGE,
          protoPath: join(__dirname, '/user.proto'),
          url: `127.0.0.1:${process.env.USER_PORT_GRPC}`,
        },
      },
      {
        name: NAME_SERVICE_GRPC.STORAGE_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.STORAGE_PACKAGE,
          protoPath: join(__dirname, '/storage.proto'),
          url: `127.0.0.1:50057`,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientsModule {}
