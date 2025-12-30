import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NAME_SERVICE_GRPC.PRODUCT_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.PRODUCT_PACKAGE,
          protoPath: join(__dirname, '/product.proto'),
          url: `127.0.0.1:${process.env.PRODUCT_PORT_GRPC}`,
        },
      },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
