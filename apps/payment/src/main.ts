import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);

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
        groupId: 'payment-consumer-group', // Quan trọng: Để định danh nhóm Consumer
        allowAutoTopicCreation: true,
        fromBeginning: true,
      },
    },
  });

  await app.startAllMicroservices();

  await app.listen(4444);
}

bootstrap()
  .then(() => {
    console.log('Payment Service Successfully Started');
  })
  .catch((error) => {
    console.error('Payment Service Fail Started', error);
  });
