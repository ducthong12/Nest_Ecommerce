import { Injectable } from '@nestjs/common';
import { PrismaPaymentService } from '../prisma/prisma-payment.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PaymentSuccessDto } from 'common/dto/payment/payment-success.dto';
import { PaymentCancelDto } from 'common/dto/payment/cancel-payment.dto';
import { OrderCheckoutEvent } from 'common/dto/order/order-checkout.event';

@Injectable()
export class PaymentService {
  constructor(
    private prismaPayment: PrismaPaymentService,
    @InjectQueue('payment-timeout-queue') private paymentQueue: Queue,
  ) {}

  async processPaymentForOrder(data: OrderCheckoutEvent) {
    try {
      const result = await this.prismaPayment.$transaction(async (tx) => {
        return await tx.payment.create({
          data: {
            orderId: BigInt(data.id),
            amount: data.totalAmount,
            status: 'PENDING',
          },
        });
      });

      if (result) await this.addTimeoutJob(data.id.toString());
    } catch (error) {
      throw error;
    }
  }

  async processPaymentSuccessed(data: PaymentSuccessDto) {
    const payment = await this.prismaPayment.payment.findUnique({
      where: { orderId: BigInt(data.orderId) },
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

        await tx.outbox.create({
          data: {
            topic: 'payment.successed',
            payload: {
              orderId: data.orderId,
              transactionId: data.transactionId,
            },
            status: 'PENDING',
          },
        });
      });

      await this.removeTimeoutJob(data.orderId.toString());
    }

    return { message: 'Payment processed successfully.', isSuccess: true };
  }

  async processPaymentCanceled(data: PaymentCancelDto) {
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
            topic: 'payment.canceled',
            payload: {
              orderId: data.orderId,
            },
            status: 'PENDING',
          },
        });
      });

      await this.removeTimeoutJob(data.orderId.toString());
    }

    return { message: 'Payment processed successfully.', isSuccess: true };
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
            topic: 'payment.canceled',
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
