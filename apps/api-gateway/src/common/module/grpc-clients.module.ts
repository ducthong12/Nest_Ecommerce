// src/common/modules/grpc-clients.module.ts
import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.register([
      {
        name: NAME_SERVICE_GRPC.INVENTORY_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.INVENTORY_PACKAGE,
          protoPath: join(__dirname, '/inventory.proto'),
          url: process.env.INVENTORY_GRPC_URL,
        },
      },
      {
        name: NAME_SERVICE_GRPC.ORDER_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.ORDER_PACKAGE,
          protoPath: join(__dirname, '/order.proto'),
          url: process.env.ORDER_GRPC_URL,
        },
      },
      {
        name: NAME_SERVICE_GRPC.PAYMENT_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.PAYMENT_PACKAGE,
          protoPath: join(__dirname, '/payment.proto'),
          url: process.env.PAYMENT_GRPC_URL,
        },
      },
      {
        name: NAME_SERVICE_GRPC.PRODUCT_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.PRODUCT_PACKAGE,
          protoPath: join(__dirname, '/product.proto'),
          url: process.env.PRODUCT_GRPC_URL,
        },
      },
      {
        name: NAME_SERVICE_GRPC.SEARCH_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.SEARCH_PACKAGE,
          protoPath: join(__dirname, '/search.proto'),
          url: process.env.SEARCH_GRPC_URL,
        },
      },
      {
        name: NAME_SERVICE_GRPC.USER_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.USER_PACKAGE,
          protoPath: join(__dirname, '/user.proto'),
          url: process.env.USER_GRPC_URL,
        },
      },
      {
        name: NAME_SERVICE_GRPC.STORAGE_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.STORAGE_PACKAGE,
          protoPath: join(__dirname, '/storage.proto'),
          url: process.env.STORAGE_GRPC_URL,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class GrpcClientsModule {}
