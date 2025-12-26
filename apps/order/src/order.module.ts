import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.register([
      {
        name: 'ORDER_KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'order-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          producer: {
            allowAutoTopicCreation: true,
            idempotent: true, // NÊN BẬT: Đảm bảo tin nhắn không bị gửi trùng (Exactly-once)
          },
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
