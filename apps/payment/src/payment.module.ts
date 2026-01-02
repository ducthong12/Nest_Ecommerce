import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BullModule } from '@nestjs/bullmq';
import { PrismaPaymentService } from '../prisma/prisma-payment.service';
import { BullmqModule } from '@app/bullmq';
import { PaymentProcessor } from './payment.processor';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Partitioners } from 'kafkajs';

@Module({
  imports: [
    BullmqModule,
    BullModule.registerQueue({
      name: 'payment-timeout-queue',
    }),
    ClientsModule.register([
      {
        name: 'PAYMENT_KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'payment-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
          },
          producer: {
            allowAutoTopicCreation: true,
            idempotent: true,
            createPartitioner: Partitioners.LegacyPartitioner,
          },
        },
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaPaymentService, PaymentProcessor],
})
export class PaymentModule {}
