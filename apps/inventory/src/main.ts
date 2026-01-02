import { NestFactory } from '@nestjs/core';
import { InventoryModule } from './inventory.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { ValidationPipe } from '@nestjs/common';
import { Partitioners } from 'kafkajs';

async function bootstrap() {
  const app = await NestFactory.create(InventoryModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: NAME_SERVICE_GRPC.INVENTORY_PACKAGE,
      protoPath: join(__dirname, '/inventory.proto'), // Đường dẫn đến file proto
      url: `127.0.0.1:${process.env.INVENTORY_PORT_GRPC}`,
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
        groupId: 'inventory-consumer-group', // Quan trọng: Để định danh nhóm Consumer
        allowAutoTopicCreation: true,
        fromBeginning: true,
      },
    },
  });

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.startAllMicroservices();

  await app.listen(3333);
}

bootstrap()
  .then(() => {
    console.log('Inventory Service Successfully Started');
  })
  .catch((error) => {
    console.error('Inventory Service Fail Started', error);
  });
