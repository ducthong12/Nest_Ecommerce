import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { Partitioners } from 'kafkajs';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.ORDER_PACKAGE,
      protoPath: join(__dirname, '/order.proto'), // Đường dẫn đến file proto
      url: `127.0.0.1:50053`,
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      producer: {
        createPartitioner: Partitioners.LegacyPartitioner,
      },
      consumer: {
        groupId: 'order-consumer-group', // Quan trọng: Để định danh nhóm Consumer
        allowAutoTopicCreation: true,
        fromBeginning: true,
      },
    },
  });

  await app.startAllMicroservices();

  await app.listen(6666);
}

bootstrap()
  .then(() => {
    console.log('Order Service Successfully Started');
  })
  .catch((error) => {
    console.error('Order Service Fail Started', error);
  });
