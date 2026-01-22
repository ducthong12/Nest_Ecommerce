import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from 'common/dto/payment/create-payment.dto';
import { PrismaPaymentService } from '../prisma/prisma-payment.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentSuccessDto } from 'common/dto/payment/payment-success.dto';
import { ClientKafka } from '@nestjs/microservices';
import { PaymentCancelDto } from 'common/dto/payment/cancel-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    private prismaPayment: PrismaPaymentService,
    @InjectQueue('payment-timeout-queue') private paymentQueue: Queue,
    @Inject('PAYMENT_KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
  ) {}

  async createPayment(data: CreatePaymentDto) {
    await this.prismaPayment.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.amount,
          status: 'PENDING',
        },
      });
    });

    await this.addTimeoutJob(data.orderId.toString());
  }

  async paymentSuccess(data: PaymentSuccessDto) {
    const payment = await this.prismaPayment.payment.findUnique({
      where: { orderId: data.orderId },
    });

    if (payment && payment.status === 'PENDING') {
      await this.prismaPayment.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId: BigInt(data.orderId) },
          data: {
            status: 'SUCCESS',
            transactionId: data.transactionId,
          },
        });
      });

      await this.removeTimeoutJob(data.orderId.toString());
    }
  }

  async paymentCancel(data: PaymentCancelDto) {
    const payment = await this.prismaPayment.payment.findUnique({
      where: { orderId: BigInt(data.orderId) },
    });

    if (payment && payment.status === 'PENDING') {
      await this.prismaPayment.$transaction(async (tx) => {
        await tx.payment.update({
          where: { orderId: BigInt(data.orderId) },
          data: {
            status: 'FAILED',
          },
        });

        await tx.outbox.create({
          data: {
            topic: 'order.cancel',
            payload: { orderId: data.orderId },
            status: 'PENDING',
          },
        });
      });

      await this.removeTimeoutJob(data.orderId.toString());
    }
  }

  async expirePayment(orderId: string) {
    await this.prismaPayment.$transaction(async (tx) => {
      const result = await tx.payment.update({
        where: {
          orderId: BigInt(orderId),
          status: 'PENDING',
        },
        data: {
          status: 'EXPIRED',
        },
      });

      if (result.orderId) {
        await tx.outbox.create({
          data: {
            topic: 'order.cancel',
            payload: { orderId: orderId },
            status: 'PENDING',
          },
        });
      }
    });
  }

  async addTimeoutJob(orderId: string) {
    await this.paymentQueue.add(
      'check-payment-status',
      { orderId: orderId },
      {
        delay: 2 * 60 * 1000,
        jobId: `payment-timeout-${orderId}`,
        removeOnComplete: true,
      },
    );
  }

  async removeTimeoutJob(orderId: string) {
    const jobId = `payment-timeout-${orderId}`;

    const job = await this.paymentQueue.getJob(jobId);

    if (job) {
      await job.remove();
    }
  }
}
