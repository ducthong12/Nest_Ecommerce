import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { PaymentCancelDto } from 'common/dto/payment/cancel-payment.dto';
import { PaymentByCashDto } from 'common/dto/payment/payment-cash.dto';
import { PaymentSuccessDto } from 'common/dto/payment/payment-success.dto';
import { MicroserviceErrorHandler } from '../common/microservice-error.handler';
import { catchError, firstValueFrom, throwError, timeout } from 'rxjs';
import { NAME_SERVICE_GRPC } from '@common/constants/port-grpc.constant';
import { PaymentGrpcDto } from 'common/dto/grpc/payment-grpc.dto';

@Injectable()
export class PaymentService {
  private paymentService: PaymentGrpcDto;

  constructor(
    @Inject(NAME_SERVICE_GRPC.PAYMENT_SERVICE) private client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.paymentService = this.client.getService<PaymentGrpcDto>(
      NAME_SERVICE_GRPC.PAYMENT_SERVICE,
    );
  }

  async paymentSuccess(payment: PaymentSuccessDto) {
    try {
      return await firstValueFrom(
        this.paymentService.paymentSuccessed(payment).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
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
      return await firstValueFrom(
        this.paymentService.paymentCanceled(payment).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
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
      return await firstValueFrom(
        this.paymentService.paymentSuccessed(payment).pipe(
          timeout(10000),
          catchError((error) => throwError(() => error)),
        ),
      );
    } catch (error) {
      MicroserviceErrorHandler.handleError(
        error,
        `payment by cash: ${JSON.stringify(payment)}`,
        'Payment Service',
      );
    }
  }
}
