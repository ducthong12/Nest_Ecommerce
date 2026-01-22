import { Observable } from 'rxjs';
import { PaymentSuccessDto } from '../payment/payment-success.dto';
import { PaymentCancelDto } from '../payment/cancel-payment.dto';

export class PaymentGrpcDto {
  paymentSuccessed: (data: PaymentSuccessDto) => Observable<any>;
  paymentCanceled: (data: PaymentCancelDto) => Observable<any>;
}
