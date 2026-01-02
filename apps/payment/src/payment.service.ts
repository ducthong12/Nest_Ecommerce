import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from 'common/dto/payment/create-payment.dto';
import { PrismaPaymentService } from '../prisma/prisma-payment.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentSuccessDto } from 'common/dto/payment/payment-success.dto';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class PaymentService {
  constructor(
    private prismaPayment: PrismaPaymentService,
    @InjectQueue('payment-timeout-queue') private paymentQueue: Queue,
    @Inject('PAYMENT_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async createPayment(data: CreatePaymentDto) {
    await this.prismaPayment.payment.create({
      data: {
        orderId: data.orderId,
        amount: data.amount,
        status: 'PENDING',
      },
    });

    await this.paymentQueue.add(
      'check-payment-status',
      { orderId: data.orderId },
      {
        delay: 2 * 60 * 1000,
        jobId: `payment-timeout-${data.orderId}`,
        removeOnComplete: true,
      },
    );
  }

  async paymentSuccess(data: PaymentSuccessDto) {
    const payment = await this.prismaPayment.payment.findUnique({
      where: { orderId: data.orderId },
    });

    if (payment && payment.status === 'PENDING') {
      await this.prismaPayment.payment.update({
        where: { orderId: BigInt(data.orderId) },
        data: {
          status: 'SUCCESS',
          transactionId: data.transactionId,
        },
      });

      // Bắn Kafka báo cho Order & Inventory biết
      //this.kafkaClient.emit('payment.success', { orderId: data.orderId });
    }
  }

  async expirePayment(orderId: string) {
    const result = await this.prismaPayment.payment.update({
      where: {
        orderId: BigInt(orderId),
        status: 'PENDING',
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.orderId) {
      this.kafkaClient.emit(
        'order.cancel',
        JSON.stringify({
          orderId,
        }),
      );
    }
  }
}
