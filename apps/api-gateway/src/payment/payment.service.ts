import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { PaymentCancelDto } from 'common/dto/payment/cancel-payment.dto';
import { PaymentByCashDto } from 'common/dto/payment/payment-cash.dto';
import { PaymentSuccessDto } from 'common/dto/payment/payment-success.dto';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';

@Injectable()
export class PaymentService {
  constructor(
    @Inject('API_PAYMENT_KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async paymentSuccess(payment: PaymentSuccessDto) {
    try {
      this.kafkaClient.emit(
        'payment.success',
        JSON.stringify({
          orderId: payment.orderId,
          transactionId: payment.transactionId,
        }),
      );

      this.kafkaClient.emit(
        'order.confirm',
        JSON.stringify({
          orderId: payment.orderId,
        }),
      );

      return {
        message: 'Payment successful and order confirmed.',
        isSuccess: true,
      };
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `payment success: ${JSON.stringify(payment)}`,
        'Payment Service',
      );
    }
  }

  async paymentCancel(payment: PaymentCancelDto) {
    try {
      this.kafkaClient.emit(
        'payment.cancel',
        JSON.stringify({
          orderId: payment.orderId,
        }),
      );

      return {
        message: 'Payment cancelled and order cancelled.',
        isSuccess: true,
      };
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `payment cancel: ${JSON.stringify(payment)}`,
        'Payment Service',
      );
    }
  }

  async paymentByCash(payment: PaymentByCashDto) {
    try {
      this.kafkaClient.emit(
        'payment.success',
        JSON.stringify({
          orderId: payment.orderId,
          transactionId: payment.transactionId,
        }),
      );

      this.kafkaClient.emit(
        'order.confirm',
        JSON.stringify({
          orderId: payment.orderId,
        }),
      );

      return {
        message: 'Payment successful and order confirmed.',
        isSuccess: true,
      };
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `payment by cash: ${JSON.stringify(payment)}`,
        'Payment Service',
      );
    }
  }
}
