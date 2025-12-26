import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { join } from 'path';

@Module({
  imports: [
    InventoryModule,
    ClientsModule.register([
      {
        name: NAME_SERVICE_GRPC.ORDER_SERVICE,
        transport: Transport.GRPC,
        options: {
          package: NAME_SERVICE_GRPC.ORDER_PACKAGE,
          protoPath: join(__dirname, '/order.proto'),
          url: `0.0.0.0:${process.env.ORDER_SERVICE_GRPC_PORT}`,
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
